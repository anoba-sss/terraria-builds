(() => {
  'use strict';

  const CLASS_DEFAULTS = {
    melee:    { name: 'Воин',        color: '#e0664a', blurb: 'Ближний бой: мечи, копья, кастеты и броня ближнего боя.' },
    magic:    { name: 'Маг',         color: '#5fa8e8', blurb: 'Магия: посохи, книги и зелья маны.' },
    summoner: { name: 'Призыватель', color: '#a98be8', blurb: 'Миньоны, хлысты и посохи призыва.' },
    ranged:   { name: 'Стрелок',     color: '#7fc96b', blurb: 'Дальний бой: луки, ружья, пушки и патроны.' }
  };
  let CLASSES = JSON.parse(JSON.stringify(CLASS_DEFAULTS));
  const ORDER = ['melee', 'magic', 'summoner', 'ranged'];
  const CATS = [
    { id: 'armor', name: 'Броня' },
    { id: 'weapons', name: 'Оружие' },
    { id: 'accessories', name: 'Аксессуары' },
    { id: 'buffs', name: 'Баффы' }
  ];
  const BOSS_NAMES = {
    ks: 'Король слизней', eye: 'Глаз Ктулху', eow: 'Пожиратель миров', boc: 'Мозг Ктулху',
    'queen-bee': 'Королева пчёл', skeletron: 'Скелетрон', wof: 'Стена плоти',
    'queen-slime': 'Королева слизней', destroyer: 'Уничтожитель', twins: 'Близнецы',
    'skeletron-prime': 'Скелетрон Прайм', plantera: 'Плантера', duke: 'Герцог Рыброн',
    golem: 'Голем', empress: 'Императрица света', lunatic: 'Культист Лунатик', 'moon-lord': 'Лунный Лорд'
  };
  const STATUS_DEFAULT = { ok: 'Данные проверены', partial: 'Проверено частично', none: 'Данных по вики нет' };
  const WIKI = 'https://terraria.wiki.gg/wiki/';
  const CFG_KEY = 'tb.editor.v1';

  // ======================================================================
  //  ОФОРМЛЕНИЕ САЙТА (data/site.json)
  //  Хранится отдельным файлом. Все значения проходят проверку (sanitizeSite),
  //  поэтому в CSS попадают только безопасные числа, цвета, шрифты и ссылки.
  // ======================================================================
  const SITE_CACHE_KEY = 'tb.site.cache.v1';
  const SAFE = /[?&]safe=1(?:&|$)/.test(location.search);   // ?safe=1 — открыть сайт без оформления

  const SYSTEM_STACKS = {
    'Системный': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    'Georgia (с засечками)': 'Georgia, "Times New Roman", serif',
    'Моноширинный': 'ui-monospace, Consolas, "Courier New", monospace'
  };
  // w — какие начертания запрашивать у Google Fonts (пусто = у шрифта одно начертание)
  const FONTS = {
    'Golos Text': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Unbounded': { w: [500, 600, 700, 800], f: 'sans-serif' },
    'Inter': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Roboto': { w: [400, 500, 700], f: 'sans-serif' },
    'Montserrat': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Nunito': { w: [400, 600, 700, 800], f: 'sans-serif' },
    'Rubik': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Manrope': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Onest': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Open Sans': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Raleway': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Fira Sans': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'IBM Plex Sans': { w: [400, 500, 600, 700], f: 'sans-serif' },
    'Ubuntu': { w: [400, 500, 700], f: 'sans-serif' },
    'PT Sans': { w: [400, 700], f: 'sans-serif' },
    'Oswald': { w: [400, 500, 600, 700], f: 'sans-serif' },
    'Exo 2': { w: [400, 500, 600, 700, 800], f: 'sans-serif' },
    'Jura': { w: [400, 500, 600, 700], f: 'sans-serif' },
    'Comfortaa': { w: [400, 500, 600, 700], f: 'sans-serif' },
    'Russo One': { w: [], f: 'sans-serif' },
    'Press Start 2P': { w: [], f: 'monospace' },
    'Merriweather': { w: [400, 700], f: 'serif' },
    'PT Serif': { w: [400, 700], f: 'serif' },
    'Lora': { w: [400, 500, 600, 700], f: 'serif' },
    'Playfair Display': { w: [400, 500, 600, 700, 800], f: 'serif' },
    'Philosopher': { w: [400, 700], f: 'serif' },
    'Caveat': { w: [400, 500, 600, 700], f: 'cursive' },
    'Marck Script': { w: [], f: 'cursive' },
    'Bad Script': { w: [], f: 'cursive' }
  };
  function fontStack(name) {
    if (typeof name !== 'string') return null;
    if (Object.prototype.hasOwnProperty.call(SYSTEM_STACKS, name)) return SYSTEM_STACKS[name];
    if (Object.prototype.hasOwnProperty.call(FONTS, name)) return `"${name}", ${FONTS[name].f}`;
    return null;
  }

  // --- описание всех настроек: тип, границы, значение по умолчанию ---
  const SPEC = {};
  const addSpec = (path, o) => { SPEC[path] = o; };
  const COLOR_KEYS = ['bg', 'panel', 'panel2', 'line', 'text', 'muted', 'accent', 'cls', 'ok', 'warn'];
  const COLOR_VARS = { bg: '--bg', panel: '--panel', panel2: '--panel-2', line: '--line', text: '--text', muted: '--muted', accent: '--accent', cls: '--cls', ok: '--ok', warn: '--warn' };
  const WEIGHTS = ['400', '500', '600', '700', '800', '900'];
  addSpec('theme', { t: 'enum', opts: ['auto', 'light', 'dark'], def: 'auto' });
  COLOR_KEYS.forEach(k => addSpec('colors.' + k, { t: 'hex' }));
  ORDER.forEach(k => addSpec('classColors.' + k, { t: 'hex' }));
  ['body', 'head', 'title'].forEach(k => addSpec('fonts.' + k, { t: 'font' }));
  addSpec('type.size', { t: 'num', min: 13, max: 22, step: 1, def: 16, unit: 'px' });
  addSpec('type.lineHeight', { t: 'num', min: 1.2, max: 2, step: 0.05, def: 1.5, unit: '' });
  addSpec('type.headWeight', { t: 'enum', opts: WEIGHTS, def: '700' });
  addSpec('type.titleWeight', { t: 'enum', opts: WEIGHTS, def: '600' });
  addSpec('type.headCase', { t: 'enum', opts: ['none', 'uppercase'], def: 'none' });
  addSpec('type.nameSize', { t: 'num', min: 12, max: 26, step: 1, def: 16, unit: 'px' });
  addSpec('type.noteSize', { t: 'num', min: 10, max: 22, step: 0.5, def: 12.5, unit: 'px' });
  addSpec('layout.width', { t: 'num', min: 700, max: 2200, step: 20, def: 1280, unit: 'px' });
  addSpec('layout.cardMin', { t: 'num', min: 160, max: 520, step: 10, def: 240, unit: 'px' });
  addSpec('layout.gap', { t: 'num', min: 4, max: 40, step: 1, def: 12, unit: 'px' });
  addSpec('layout.panelPad', { t: 'num', min: 8, max: 56, step: 1, def: 22, unit: 'px' });
  addSpec('layout.cardPad', { t: 'num', min: 4, max: 32, step: 1, def: 12, unit: 'px' });
  addSpec('layout.stageGap', { t: 'num', min: 8, max: 80, step: 2, def: 22, unit: 'px' });
  addSpec('layout.heroPad', { t: 'num', min: 8, max: 80, step: 2, def: 28, unit: 'px' });
  addSpec('layout.radius', { t: 'num', min: 0, max: 36, step: 1, def: 14, unit: 'px' });
  addSpec('layout.border', { t: 'num', min: 0, max: 5, step: 1, def: 1, unit: 'px' });
  addSpec('layout.shadow', { t: 'num', min: 0, max: 100, step: 5, def: 35, unit: '%' });
  addSpec('layout.navShape', { t: 'enum', opts: ['pill', 'round', 'square'], def: 'pill' });
  addSpec('layout.stageColor', { t: 'enum', opts: ['default', 'class'], def: 'default' });
  addSpec('layout.sticky', { t: 'bool', def: true });
  addSpec('bg.mode', { t: 'enum', opts: ['default', 'plain', 'gradient', 'pattern', 'image'], def: 'default' });
  addSpec('bg.c1', { t: 'hex' });
  addSpec('bg.c2', { t: 'hex' });
  addSpec('bg.angle', { t: 'num', min: 0, max: 360, step: 5, def: 135, unit: '°' });
  addSpec('bg.pattern', { t: 'enum', opts: ['dots', 'grid', 'stripes', 'cross'], def: 'dots' });
  addSpec('bg.patternSize', { t: 'num', min: 8, max: 120, step: 2, def: 24, unit: 'px' });
  addSpec('bg.patternAlpha', { t: 'num', min: 2, max: 50, step: 1, def: 12, unit: '%' });
  addSpec('bg.url', { t: 'url' });
  addSpec('bg.overlay', { t: 'num', min: 0, max: 95, step: 5, def: 40, unit: '%' });
  addSpec('bg.fixed', { t: 'bool', def: true });
  ['hero', 'heroGlow', 'eyebrow', 'legend', 'bossChips', 'counts', 'statusDots', 'notes', 'stageNum', 'panelHint', 'footer', 'brandMark', 'brandTag']
    .forEach(k => addSpec('show.' + k, { t: 'bool', def: true }));
  addSpec('show.imgSlot', { t: 'enum', opts: ['always', 'withimg', 'never'], def: 'always' });
  addSpec('anim.enabled', { t: 'bool', def: true });
  addSpec('anim.lift', { t: 'bool', def: true });
  const TEXT_DEFAULTS = {
    brandMark: '✦', brandName: 'Terraria', brandTag: 'билды к боссам', eyebrow: 'Класс',
    hint: '{cat}: нажми на предмет, чтобы увидеть рецепт и дроп.',
    empty: 'Для этой категории пока нет предметов.',
    legendOk: 'данные проверены', legendPartial: 'частично', legendNone: 'нет данных'
  };
  Object.keys(TEXT_DEFAULTS).forEach(k => addSpec('texts.' + k, { t: 'text', max: 200 }));
  addSpec('texts.pageTitle', { t: 'text', max: 120 });
  addSpec('texts.footer', { t: 'text', max: 300 });
  addSpec('texts.footerLinkText', { t: 'text', max: 80 });
  addSpec('texts.footerLinkUrl', { t: 'link' });
  CATS.forEach(c => addSpec('texts.cats.' + c.id, { t: 'text', max: 60 }));
  ORDER.forEach(k => { addSpec(`texts.classes.${k}.name`, { t: 'text', max: 60 }); addSpec(`texts.classes.${k}.blurb`, { t: 'text', max: 400 }); });
  Object.keys(BOSS_NAMES).forEach(id => addSpec('texts.bosses.' + id, { t: 'text', max: 80 }));
  Object.keys(STATUS_DEFAULT).forEach(k => addSpec('texts.status.' + k, { t: 'text', max: 80 }));
  addSpec('css', { t: 'css' });

  function getPath(o, p) {
    let c = o;
    for (const k of p.split('.')) { if (c == null || typeof c !== 'object') return undefined; c = c[k]; }
    return c;
  }
  function setPath(o, p, v) {
    const ks = p.split('.');
    let c = o;
    for (let i = 0; i < ks.length - 1; i++) {
      if (c[ks[i]] == null || typeof c[ks[i]] !== 'object') c[ks[i]] = {};
      c = c[ks[i]];
    }
    c[ks[ks.length - 1]] = v;
  }
  function delPath(o, p) {
    const ks = p.split('.');
    const chain = [o];
    let c = o;
    for (let i = 0; i < ks.length - 1; i++) {
      c = c && c[ks[i]];
      if (c == null || typeof c !== 'object') return;
      chain.push(c);
    }
    delete c[ks[ks.length - 1]];
    for (let i = chain.length - 1; i > 0; i--) {
      if (Object.keys(chain[i]).length === 0) delete chain[i - 1][ks[i - 1]]; else break;
    }
  }
  function cleanVal(spec, val) {
    switch (spec.t) {
      case 'hex': {
        if (typeof val !== 'string') return undefined;
        const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(val.trim());
        if (!m) return undefined;
        let h = m[1].toLowerCase();
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        return '#' + h;
      }
      case 'num': {
        if (val === null || typeof val === 'boolean' || (typeof val === 'string' && val.trim() === '')) return undefined;
        const n = Number(val);
        if (!Number.isFinite(n)) return undefined;
        return Math.round(Math.min(spec.max, Math.max(spec.min, n)) * 100) / 100;
      }
      case 'enum': { const s = String(val); return spec.opts.includes(s) ? s : undefined; }
      case 'bool': return typeof val === 'boolean' ? val : undefined;
      case 'text': return typeof val === 'string' && val.length ? val.slice(0, spec.max || 300) : undefined;
      case 'link': {
        if (typeof val !== 'string') return undefined;
        const s = val.trim().slice(0, 500);
        return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : undefined;
      }
      case 'url': {
        if (typeof val !== 'string') return undefined;
        const s = val.trim();
        if (!s || s.length > 1000) return undefined;
        if (/[\s"'()\\<>`{}]/.test(s)) return undefined;
        if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s)) return undefined;
        return s;
      }
      case 'font': return typeof val === 'string' && fontStack(val) ? val : undefined;
      case 'css': return typeof val === 'string' && val.trim() ? val.slice(0, 20000) : undefined;
    }
    return undefined;
  }
  function sanitizeSite(inp) {
    const out = { v: 1 };
    if (!inp || typeof inp !== 'object') return out;
    for (const [p, spec] of Object.entries(SPEC)) {
      const c = cleanVal(spec, getPath(inp, p));
      if (c !== undefined) setPath(out, p, c);
    }
    return out;
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const serJson = (o) => JSON.stringify(o, null, 1) + '\n';
  const serSite = () => serJson(sanitizeSite(SITE));

  // --- генерация CSS по настройкам ---
  function buildCss(S) {
    const g = (p) => getPath(S, p);
    const vars = [];
    const put = (name, val) => { if (val !== undefined && val !== null) vars.push(name + ':' + val); };
    const px = (p) => (typeof g(p) === 'number' ? g(p) + 'px' : null);
    COLOR_KEYS.forEach(k => put(COLOR_VARS[k], g('colors.' + k)));
    const fb = fontStack(g('fonts.body')), fh = fontStack(g('fonts.head')), ft = fontStack(g('fonts.title'));
    put('--font-body', fb); put('--font-head', fh); put('--font-title', ft);
    put('--fs-base', px('type.size'));
    put('--lh', typeof g('type.lineHeight') === 'number' ? g('type.lineHeight') : null);
    put('--head-weight', g('type.headWeight'));
    put('--title-weight', g('type.titleWeight'));
    put('--head-case', g('type.headCase'));
    put('--name-size', px('type.nameSize'));
    put('--note-size', px('type.noteSize'));
    put('--container', px('layout.width'));
    put('--card-min', px('layout.cardMin'));
    put('--gap', px('layout.gap'));
    put('--panel-pad', px('layout.panelPad'));
    put('--entry-pad', px('layout.cardPad'));
    put('--stage-gap', px('layout.stageGap'));
    put('--hero-pad', px('layout.heroPad'));
    put('--bw', px('layout.border'));
    const r = g('layout.radius');
    if (typeof r === 'number') {
      put('--radius', r + 'px');
      put('--radius-md', Math.round(r * 0.86) + 'px');
      put('--radius-sm', Math.round(r * 0.7) + 'px');
    }
    const sh = g('layout.shadow');
    if (typeof sh === 'number') put('--shadow', sh === 0 ? 'none' : '0 10px 30px rgba(0,0,0,' + (sh / 100).toFixed(2) + ')');
    if (g('layout.navShape') === 'round') put('--nav-radius', 'var(--radius-sm)');
    if (g('layout.navShape') === 'square') put('--nav-radius', '0');

    const rules = [];
    if (vars.length) rules.push(':root:root:root{' + vars.join(';') + '}');

    // фон страницы
    const mode = g('bg.mode') || 'default';
    const att = g('bg.fixed') === false ? 'scroll' : 'fixed';
    if (mode === 'plain') {
      rules.push('body{background-image:none}');
    } else if (mode === 'gradient') {
      const c1 = g('bg.c1') || 'var(--panel-2)', c2 = g('bg.c2') || 'var(--bg)';
      const ang = typeof g('bg.angle') === 'number' ? g('bg.angle') : 135;
      rules.push('body{background-image:linear-gradient(' + ang + 'deg,' + c1 + ',' + c2 + ');background-repeat:no-repeat;background-attachment:' + att + '}');
    } else if (mode === 'pattern') {
      const size = typeof g('bg.patternSize') === 'number' ? g('bg.patternSize') : 24;
      const alpha = typeof g('bg.patternAlpha') === 'number' ? g('bg.patternAlpha') : 12;
      const col = g('bg.c1') || 'var(--text)';
      const X = 'color-mix(in srgb,' + col + ' ' + alpha + '%,transparent)';
      const kind = g('bg.pattern') || 'dots';
      let img, bsize = size + 'px ' + size + 'px';
      if (kind === 'grid') img = 'linear-gradient(' + X + ' 1px,transparent 1px),linear-gradient(90deg,' + X + ' 1px,transparent 1px)';
      else if (kind === 'cross') img = 'linear-gradient(45deg,' + X + ' 1px,transparent 1px),linear-gradient(-45deg,' + X + ' 1px,transparent 1px)';
      else if (kind === 'stripes') { img = 'repeating-linear-gradient(45deg,' + X + ' 0,' + X + ' 2px,transparent 2px,transparent ' + size + 'px)'; bsize = 'auto'; }
      else img = 'radial-gradient(' + X + ' 1.5px,transparent 1.6px)';
      rules.push('body{background-image:' + img + ';background-size:' + bsize + ';background-attachment:' + att + '}');
    } else if (mode === 'image' && g('bg.url')) {
      const o = typeof g('bg.overlay') === 'number' ? g('bg.overlay') : 40;
      const layer = 'color-mix(in srgb,var(--bg) ' + o + '%,transparent)';
      rules.push('body{background-image:linear-gradient(' + layer + ',' + layer + '),url("' + g('bg.url') + '");background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:' + att + '}');
    }

    // что показывать
    const hide = (flag, sel) => { if (g('show.' + flag) === false) rules.push(sel + '{display:none!important}'); };
    hide('hero', '.hero'); hide('heroGlow', '.hero::after'); hide('eyebrow', '.eyebrow'); hide('legend', '.legend');
    hide('bossChips', '.boss-chips'); hide('counts', '.build-tab .count'); hide('statusDots', '.item-btn .status-dot');
    hide('notes', '.item-note'); hide('panelHint', '.build-panel-title'); hide('footer', '.footer');
    hide('brandMark', '.brand-mark'); hide('brandTag', '.brand-text small');
    if (g('show.stageNum') === false) rules.push('.stage-num{display:none!important}.stage-head{grid-template-columns:1fr!important}');
    const slot = g('show.imgSlot');
    if (slot === 'never') rules.push('.img-slot{display:none!important}');
    else if (slot === 'withimg') rules.push('.img-slot:not(.has-img){display:none!important}');
    if (g('anim.enabled') === false) rules.push('*,*::before,*::after{transition:none!important;animation:none!important}');
    if (g('anim.lift') === false) rules.push('.item-btn:hover{transform:none!important}');
    if (g('layout.sticky') === false) rules.push('.topbar{position:static!important}');
    if (g('css')) rules.push(g('css'));
    return rules.join('\n');
  }

  function fontsHref(S) {
    const picked = [];
    ['body', 'head', 'title'].forEach(k => {
      const n = getPath(S, 'fonts.' + k);
      if (n && FONTS[n] && !picked.includes(n)) picked.push(n);
    });
    if (!picked.length) return '';
    const fam = picked.map(n => {
      const w = FONTS[n].w;
      return 'family=' + encodeURIComponent(n).replace(/%20/g, '+') + (w.length ? ':wght@' + w.join(';') : '');
    });
    return 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap';
  }

  // «безопасный режим»: ?safe=1 игнорирует цвета, фон, макет и свой CSS
  function safeSubset(S) {
    const out = { v: 1 };
    ['texts', 'classColors', 'fonts', 'type'].forEach(k => { if (S[k]) out[k] = S[k]; });
    return out;
  }
  function loadSiteCache() {
    try { return sanitizeSite(JSON.parse(localStorage.getItem(SITE_CACHE_KEY) || '{}')); } catch (e) { return { v: 1 }; }
  }
  function saveSiteCache() {
    try { localStorage.setItem(SITE_CACHE_KEY, serSite()); } catch (e) { /* storage blocked */ }
  }


  let DATA = null;          // { classes, builds }
  let ITEMS = {};           // name -> item record
  let DIRTY = false;        // unsaved edits
  let CFG = loadCfg();      // { token, repo, branch, dir, login }
  let EDIT = !!(CFG.token && CFG.repo);
  const tabState = {};      // stage key -> active category
  let SITE = loadSiteCache();   // оформление сайта (data/site.json)
  let ES = SITE;                // оформление, которое реально применено сейчас
  const SNAP = {};              // сериализованное состояние файлов на момент загрузки/сохранения
  let SAVING = false;

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }
  function loadCfg() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch (e) { /* storage blocked */ }
  }
  const wikiUrl = (en) => WIKI + encodeURIComponent(en.replace(/ /g, '_')).replace(/%27/g, "'");
  const emptyItem = () => ({ en: '', wiki: '', recipes: [], drops: [], obtain: '', description: '', status: 'none', issue: '', hasDrop: false });
  const itemData = (name) => ITEMS[name] || emptyItem();
  const ensureItem = (name) => (ITEMS[name] = ITEMS[name] || emptyItem());
  const cleanNote = (n) => (n ? n.replace(/^или\s+/i, '').trim() || null : null);
  function markDirty() { DIRTY = true; renderSaveBar(); }
  function toast(text) {
    let t = $('#toast');
    if (!t) { t = el('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(t); }
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, Math.max(3200, text.length * 70));
  }

  // ---------- applying the appearance ----------
  const DEFAULT_TITLE = document.title;
  const FOOTER_ORIG = Array.from(($('.footer') || { childNodes: [] }).childNodes).map(n => n.cloneNode(true));

  function T(path, def) {
    const v = getPath(ES, 'texts.' + path);
    return typeof v === 'string' && v !== '' ? v : def;
  }
  const catLabel = (c) => T('cats.' + c.id, c.name);
  const bossName = (id) => T('bosses.' + id, BOSS_NAMES[id] || id);
  const statusText = (v) => T('status.' + v, STATUS_DEFAULT[v] || '');

  function applyChrome() {
    document.title = T('pageTitle', DEFAULT_TITLE);
    const mark = $('.brand-mark'), name = $('.brand-text strong'), tag = $('.brand-text small');
    if (mark) mark.textContent = T('brandMark', TEXT_DEFAULTS.brandMark);
    if (name) name.textContent = T('brandName', TEXT_DEFAULTS.brandName);
    if (tag) tag.textContent = T('brandTag', TEXT_DEFAULTS.brandTag);
    const f = $('.footer');
    if (f) {
      const ft = T('footer', '');
      if (ft) {
        const nodes = [document.createTextNode(ft)];
        const lt = T('footerLinkText', ''), lu = T('footerLinkUrl', '');
        if (lt && lu) nodes.push(document.createTextNode(' '), el('a', { href: lu, target: '_blank', rel: 'noopener noreferrer', text: lt }));
        f.replaceChildren(...nodes);
      } else {
        f.replaceChildren(...FOOTER_ORIG.map(n => n.cloneNode(true)));
      }
    }
  }

  function applySite() {
    ES = SAFE ? safeSubset(SITE) : SITE;
    CLASSES = clone(CLASS_DEFAULTS);
    ORDER.forEach(k => {
      const col = getPath(ES, 'classColors.' + k);
      const nm = getPath(ES, `texts.classes.${k}.name`);
      const bl = getPath(ES, `texts.classes.${k}.blurb`);
      if (col) CLASSES[k].color = col;
      if (nm) CLASSES[k].name = nm;
      if (bl) CLASSES[k].blurb = bl;
    });
    const root = document.documentElement;
    if (ES.theme === 'light' || ES.theme === 'dark') root.setAttribute('data-theme', ES.theme);
    else root.removeAttribute('data-theme');
    let link = document.getElementById('site-fonts');
    const href = fontsHref(ES);
    if (href) {
      if (!link) { link = el('link', { id: 'site-fonts', rel: 'stylesheet' }); document.head.append(link); }
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    } else if (link) {
      link.remove();
    }
    let st = document.getElementById('site-style');
    if (!st) { st = document.createElement('style'); st.id = 'site-style'; document.head.append(st); }
    const css = buildCss(ES);
    if (st.textContent !== css) st.textContent = css;
    applyChrome();
  }

  // ---------- build rendering ----------
  function renderClassNav(active) {
    $('#class-nav').replaceChildren(...ORDER.map(key => {
      const c = CLASSES[key];
      return el('button', {
        class: 'class-btn', type: 'button', 'aria-current': key === active ? 'page' : null,
        style: `--cls:${c.color}`, onclick: () => { location.hash = key; }
      }, [el('span', { class: 'class-dot' }), c.name]);
    }));
  }

  function itemButton(name, note, onRemove, alt) {
    const d = itemData(name);
    const slot = el('span', { class: 'img-slot', 'aria-hidden': 'true' });
    if (d.img) {
      const im = el('img', { src: d.img, alt: '', loading: 'lazy' });
      im.addEventListener('error', () => { im.remove(); slot.classList.remove('has-img'); });
      slot.classList.add('has-img');
      slot.append(im);
    }
    const btn = el('button', { class: 'item-btn', type: 'button', 'data-item': name, onclick: () => openItem(name, alt) }, [
      slot,
      el('span', {}, [
        el('span', { class: 'item-name' }, [name]),
        note ? el('span', { class: 'item-note', text: note }) : null
      ]),
      el('span', { class: `status-dot ${d.status}`, title: statusText(d.status) })
    ]);
    if (!EDIT || !onRemove) return btn;
    return el('div', { class: 'item-wrap' }, [
      btn,
      el('button', { class: 'remove-btn', type: 'button', title: 'Убрать из этапа', 'aria-label': 'Убрать из этапа', text: '×', onclick: onRemove })
    ]);
  }

  function renderCategory(stage, cat) {
    const entries = stage.cats[cat] || [];
    const cards = entries.map((alts, ei) => el('div', { class: 'entry' }, [
      el('div', { class: 'alt-row' }, alts.flatMap((a, ai) => [
        ai > 0 ? el('span', { class: 'alt-sep', text: 'или' }) : null,
        itemButton(a.name, cleanNote(a.note), EDIT ? () => removeAlt(stage, cat, ei, ai) : null, a)
      ])),
      EDIT ? altAdder(stage, cat, ei) : null
    ]));
    if (!entries.length) cards.push(el('p', { class: 'empty', text: T('empty', TEXT_DEFAULTS.empty) }));
    if (EDIT) cards.push(addEntryForm(stage, cat));
    return el('div', { class: 'entry-grid' }, cards);
  }

  function addEntryForm(stage, cat) {
    const name = el('input', { class: 'ed-input', type: 'text', list: 'item-names', placeholder: 'Название предмета' });
    const note = el('input', { class: 'ed-input', type: 'text', placeholder: 'Примечание (необязательно)' });
    const submit = () => {
      const n = name.value.trim();
      if (!n) { toast('Введи название предмета'); return; }
      addEntry(stage, cat, n, note.value.trim() || null);
    };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    return el('div', { class: 'entry add-entry' }, [
      el('div', { class: 'add-title', text: '+ Добавить предмет' }),
      name, note,
      el('button', { class: 'ed-btn primary', type: 'button', text: 'Добавить в эту категорию', onclick: submit })
    ]);
  }

  function renderStage(classKey, stage, index) {
    const key = `${classKey}:${index}`;
    const active = tabState[key] || 'armor';
    const tabs = el('div', { class: 'build-tabs', role: 'tablist' }, CATS.map(c => el('button', {
      class: 'build-tab', type: 'button', role: 'tab', 'aria-selected': c.id === active ? 'true' : 'false',
      onclick: () => { tabState[key] = c.id; renderAll(); }
    }, [catLabel(c), el('span', { class: 'count', text: String((stage.cats[c.id] || []).length) })])));
    const panel = el('div', { class: 'build-panel', role: 'tabpanel', id: `panel-${key}` }, [
      el('p', { class: 'build-panel-title', text: T('hint', TEXT_DEFAULTS.hint).split('{cat}').join(catLabel(CATS.find(c => c.id === active))) }),
      renderCategory(stage, active)
    ]);
    const head = el('div', { class: 'stage-head' }, [
      el('div', { class: 'stage-num', text: String(index + 1) }),
      el('div', {}, [
        el('div', { class: 'stage-title-row' }, [el('h2', { class: 'stage-title', text: stage.title }), EDIT ? titleEditBtn(stage) : null]),
        el('div', { class: 'boss-chips' }, stage.bosses.map(b => el('span', { class: 'boss-chip', text: bossName(b) })))
      ])
    ]);
    const stageStyle = getPath(ES, 'layout.stageColor') === 'class' && CLASSES[classKey] ? `--cls:${CLASSES[classKey].color}` : null;
    return el('section', { class: 'stage', id: `stage-${index + 1}`, style: stageStyle }, [head, tabs, panel]);
  }

  function renderClass(key) {
    const c = CLASSES[key];
    const stages = DATA.builds[key] || [];
    const hero = el('section', { class: 'hero', style: `--cls:${c.color}` }, [
      el('p', { class: 'eyebrow', text: T('eyebrow', TEXT_DEFAULTS.eyebrow) }),
      el('h1', { text: c.name }),
      el('p', { text: c.blurb }),
      el('div', { class: 'legend' }, [
        el('span', {}, [el('span', { class: 'status-dot ok' }), T('legendOk', TEXT_DEFAULTS.legendOk)]),
        el('span', {}, [el('span', { class: 'status-dot partial' }), T('legendPartial', TEXT_DEFAULTS.legendPartial)]),
        el('span', {}, [el('span', { class: 'status-dot' }), T('legendNone', TEXT_DEFAULTS.legendNone)])
      ])
    ]);
    $('#app').replaceChildren(hero, ...stages.map((s, i) => renderStage(key, s, i)));
  }

  function renderDatalist() {
    let dl = $('#item-names');
    if (!dl) { dl = el('datalist', { id: 'item-names' }); document.body.append(dl); }
    dl.replaceChildren(...Object.keys(ITEMS).sort().map(n => el('option', { value: n })));
  }

  function renderAll() {
    const key = currentClass();
    renderClassNav(key);
    renderClass(key);
    renderDatalist();
    document.body.classList.toggle('editing', EDIT);
    $('#edit-badge').hidden = !EDIT;
    const designBtn = $('#design-btn');
    if (designBtn) designBtn.hidden = !EDIT;
    renderSaveBar();
  }

  function currentClass() {
    const h = (location.hash || '').replace('#', '');
    return CLASSES[h] ? h : 'melee';
  }

  // ---------- build edits ----------
  function removeAlt(stage, cat, ei, ai) {
    const alts = stage.cats[cat][ei];
    alts.splice(ai, 1);
    if (!alts.length) stage.cats[cat].splice(ei, 1);
    markDirty();
    renderAll();
  }
  // кнопка «+ или»: добавляет альтернативу к уже существующей строке билда
  function altAdder(stage, cat, ei) {
    const box = el('div', { class: 'alt-adder' });
    const close = () => box.replaceChildren(el('button', { class: 'ed-btn', type: 'button', text: '+ или', onclick: open }));
    function open() {
      const name = el('input', { class: 'ed-input', type: 'text', list: 'item-names', placeholder: 'Название предмета (вариант «или»)' });
      const note = el('input', { class: 'ed-input', type: 'text', placeholder: 'Примечание (необязательно)' });
      const save = () => {
        const n = name.value.trim();
        if (!n) { toast('Введи название предмета'); return; }
        addAlt(stage, cat, ei, n, note.value.trim() || null);
      };
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
      box.replaceChildren(el('div', { class: 'alt-form' }, [
        name, note,
        el('button', { class: 'ed-btn primary', type: 'button', text: 'Добавить «или»', onclick: save }),
        el('button', { class: 'ed-btn', type: 'button', text: 'Отмена', onclick: close })
      ]));
      name.focus();
    }
    close();
    return box;
  }
  function addAlt(stage, cat, ei, name, note) {
    ensureItem(name);
    stage.cats[cat][ei].push({ name, note });
    markDirty();
    renderAll();
    toast(`«${name}» добавлен как вариант «или»`);
  }
  function addEntry(stage, cat, name, note) {
    ensureItem(name);
    stage.cats[cat].push([{ name, note }]);
    markDirty();
    renderAll();
    toast(`«${name}» добавлен`);
  }

  function renameItem(oldName, newName) {
    ITEMS = Object.fromEntries(Object.entries(ITEMS).map(([k, v]) => [k === oldName ? newName : k, v]));
    let n = 0;
    for (const stages of Object.values(DATA.builds || {})) {
      if (!Array.isArray(stages)) continue;
      for (const st of stages) {
        for (const list of Object.values(st.cats || {})) {
          if (!Array.isArray(list)) continue;
          for (const alts of list) {
            if (!Array.isArray(alts)) continue;
            for (const a of alts) if (a && a.name === oldName) { a.name = newName; n++; }
          }
        }
      }
    }
    return n;
  }
  function titleEditBtn(stage) {
    const btn = el('button', { class: 'title-edit', type: 'button', title: 'Изменить заголовок этапа', 'aria-label': 'Изменить заголовок этапа', text: '✎' });
    btn.addEventListener('click', () => {
      const row = btn.parentElement;
      const h2 = row.querySelector('.stage-title');
      const inp = el('input', { class: 'ed-input', type: 'text', 'aria-label': 'Заголовок этапа' });
      inp.value = stage.title;
      let done = false;
      const finish = (save) => {
        if (done) return;
        done = true;
        const v = inp.value.trim();
        if (save && v && v !== stage.title) { stage.title = v; markDirty(); }
        renderAll();
      };
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        else if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
      });
      inp.addEventListener('blur', () => finish(true));
      h2.replaceWith(inp);
      btn.remove();
      inp.focus();
      inp.select();
    });
    return btn;
  }

  // ---------- item view modal ----------
  function openItem(name, alt) {
    if (EDIT) { openItemEditor(name, alt); return; }
    const d = itemData(name);
    const c = CLASSES[currentClass()];
    const sec = (title, children) => el('section', { class: 'modal-section' }, [el('h3', { text: title }), ...children]);
    const renderRecipe = (r) => el('div', { class: 'recipe' }, [
      el('div', { class: 'recipe-station', text: `Станция: ${r.stationRu || r.station || 'нет'}` }),
      el('div', { class: 'ingredients' }, r.ingredients.map(i => el('a', {
        class: 'ingredient', href: wikiUrl(i.en), target: '_blank', rel: 'noopener noreferrer',
        title: `${i.en}: открыть страницу на вики`
      }, [i.ru || i.en, el('b', { text: `×${i.count}` })])))
    ]);

    const body = [];
    if (d.description) body.push(sec('Описание', [el('p', { class: 'desc', text: d.description })]));
    let hasRecipe = false;
    if (d.pieces && d.pieces.length) {
      const pieces = d.pieces.filter(p => p.recipes && p.recipes.length).map(p => el('div', { class: 'piece' }, [
        el('div', { class: 'piece-name' }, [el('span', { text: p.ru || p.en }), p.en && p.ru ? el('small', { text: p.en }) : null]),
        ...p.recipes.map(renderRecipe)
      ]));
      if (pieces.length) { body.push(sec('Рецепт по частям', pieces)); hasRecipe = true; }
    } else if (d.recipes.length) {
      body.push(sec('Рецепт', d.recipes.map(renderRecipe))); hasRecipe = true;
    }
    if (d.drops.length) {
      body.push(sec('Дроп', [el('ul', { class: 'drop-list' }, d.drops.map(x => el('li', { title: x.source }, [x.ru || x.source, x.chance ? ` — ${x.chance}` : '']))) ]));
    }
    if (d.obtain) body.push(sec('Получение', [el('p', { text: d.obtain })]));
    if (!hasRecipe && !d.drops.length && !d.obtain) {
      body.push(sec('Рецепт и дроп', [el('p', { class: 'empty', text: 'Данные по вики пока не найдены. Нужна ручная проверка.' })]));
    }
    if (d.issue && d.status !== 'ok') body.push(el('div', { class: 'source-block', text: d.issue }));
    if (d.wiki) body.push(el('div', { class: 'source-block' }, ['Источник: ', el('a', { href: d.wiki, target: '_blank', rel: 'noopener noreferrer', text: d.wiki })]));

    showModal(el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': name, style: `--cls:${c.color}` }, [
      el('div', { class: 'modal-head' }, [
        el('div', {}, [
          el('h2', { text: name }),
          el('div', { class: 'sub' }, [d.en ? `${d.en} · ` : '', el('span', { class: `badge ${d.status}`, text: statusText(d.status) })])
        ]),
        el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Закрыть', text: '×', onclick: closeModal })
      ]),
      el('div', { class: 'modal-body' }, body)
    ]));
  }

  // ---------- item editor modal (owner only) ----------
  function field(label, value, onInput, opts = {}) {
    const i = el(opts.multiline ? 'textarea' : 'input', {
      class: 'ed-input', placeholder: opts.ph || '', type: opts.type || 'text', ...(opts.multiline ? { rows: 3 } : {})
    });
    i.value = value ?? '';
    i.addEventListener('input', () => onInput(opts.type === 'number' ? (Number(i.value) || 1) : i.value));
    return el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: label }), i]);
  }

  function recipesEditor(recipes) {
    const box = el('div', { class: 'ed-list' });
    const render = () => {
      box.replaceChildren(
        ...recipes.map((r, ri) => el('div', { class: 'ed-card' }, [
          el('div', { class: 'ed-row' }, [
            field('Станция (русск.)', r.stationRu, v => { r.stationRu = v; }, { ph: 'Верстак / Наковальня / нет' }),
            field('Станция (англ.)', r.station, v => { r.station = v; }, { ph: 'Workbench / Anvil / нет' }),
            el('button', { class: 'ed-btn danger', type: 'button', text: 'Удалить рецепт', onclick: () => { recipes.splice(ri, 1); render(); } })
          ]),
          el('div', { class: 'ed-label', text: 'Ингредиенты (русское название для сайта, английское — для ссылки на вики)' }),
          ...r.ingredients.map((ing, ii) => el('div', { class: 'ed-row' }, [
            field('Название (русск.)', ing.ru, v => { ing.ru = v; }, { ph: 'Прочная окаменелость' }),
            field('Название (англ.)', ing.en, v => { ing.en = v; }, { ph: 'Sturdy Fossil' }),
            field('Кол-во', ing.count, v => { ing.count = v; }, { type: 'number' }),
            el('button', { class: 'ed-btn danger small', type: 'button', text: '×', 'aria-label': 'Удалить ингредиент', onclick: () => { r.ingredients.splice(ii, 1); render(); } })
          ])),
          el('button', { class: 'ed-btn', type: 'button', text: '+ ингредиент', onclick: () => { r.ingredients.push({ ru: '', en: '', count: 1 }); render(); } })
        ])),
        el('button', { class: 'ed-btn primary', type: 'button', text: '+ рецепт', onclick: () => { recipes.push({ station: '', stationRu: '', ingredients: [] }); render(); } })
      );
    };
    render();
    return box;
  }

  function piecesEditor(pieces) {
    const box = el('div', { class: 'ed-list' });
    const render = () => {
      box.replaceChildren(
        ...pieces.map((p, pi) => el('div', { class: 'ed-card' }, [
          el('div', { class: 'ed-row' }, [
            field('Деталь (русск.)', p.ru, v => { p.ru = v; }, { ph: 'Грибной шлем' }),
            field('Деталь (англ.)', p.en, v => { p.en = v; }, { ph: 'Shroomite Headgear' }),
            el('button', { class: 'ed-btn danger', type: 'button', text: 'Удалить деталь', onclick: () => { pieces.splice(pi, 1); render(); } })
          ]),
          recipesEditor(p.recipes)
        ])),
        el('button', { class: 'ed-btn primary', type: 'button', text: '+ деталь', onclick: () => { pieces.push({ ru: '', en: '', recipes: [] }); render(); } })
      );
    };
    render();
    return box;
  }

  function dropsEditor(drops) {
    const box = el('div', { class: 'ed-list' });
    const render = () => {
      box.replaceChildren(
        ...drops.map((d, di) => el('div', { class: 'ed-row' }, [
          field('Источник (русск.)', d.ru, v => { d.ru = v; }, { ph: 'Дьяволист' }),
          field('Источник (англ.)', d.source, v => { d.source = v; }, { ph: 'Diabolist' }),
          field('Шанс', d.chance, v => { d.chance = v; }, { ph: '25%' }),
          el('button', { class: 'ed-btn danger small', type: 'button', text: '×', 'aria-label': 'Удалить дроп', onclick: () => { drops.splice(di, 1); render(); } })
        ])),
        el('button', { class: 'ed-btn primary', type: 'button', text: '+ дроп', onclick: () => { drops.push({ source: '', ru: '', chance: '' }); render(); } })
      );
    };
    render();
    return box;
  }

  function okImgUrl(v) { return !v || /^https?:\/\/\S+$/i.test(v) || /^[\w][\w./%~+-]*$/.test(v); }

  function openItemEditor(name, alt) {
    const draft = JSON.parse(JSON.stringify(itemData(name)));
    let isSet = !!(draft.pieces && draft.pieces.length);
    const c = CLASSES[currentClass()];
    let newName = name;
    let noteVal = alt ? (alt.note || '') : '';
    const statusSel = el('select', { class: 'ed-input' }, Object.keys(STATUS_DEFAULT).map(v =>
      el('option', { value: v, selected: v === draft.status ? true : null, text: statusText(v) })));
    statusSel.value = draft.status;

    // живой предпросмотр карточки
    const pvName = el('span', { class: 'item-name' });
    const pvNote = el('span', { class: 'item-note' });
    const pvSlot = el('span', { class: 'img-slot', 'aria-hidden': 'true' });
    const pvDot = el('span', { class: `status-dot ${draft.status}` });
    const preview = el('div', { class: 'item-btn preview', 'aria-label': 'Так карточка выглядит на сайте' }, [pvSlot, el('span', {}, [pvName, pvNote]), pvDot]);
    const refreshPreview = () => {
      pvName.textContent = newName.trim() || '…';
      pvNote.textContent = noteVal.trim();
      pvNote.hidden = !noteVal.trim();
      pvSlot.replaceChildren();
      pvSlot.classList.remove('has-img');
      pvDot.className = `status-dot ${draft.status}`;
      const u = (draft.img || '').trim();
      if (u && okImgUrl(u)) {
        const im = el('img', { src: u, alt: '' });
        im.addEventListener('error', () => { im.remove(); pvSlot.classList.remove('has-img'); });
        pvSlot.classList.add('has-img');
        pvSlot.append(im);
      }
    };
    statusSel.addEventListener('change', () => { draft.status = statusSel.value; refreshPreview(); });

    // переключатель: один предмет (рецепт) или набор из деталей (броня и т.п.)
    const recipeSection = el('section', { class: 'modal-section' });
    const drawRecipeSection = () => {
      const modeRow = el('div', { class: 'ed-row' }, [
        el('button', { class: 'ed-btn' + (isSet ? '' : ' primary'), type: 'button', text: 'Один предмет (рецепт)', onclick: () => {
          if (!isSet) return;
          const hasParts = (draft.pieces || []).some(p => (p.recipes || []).length || p.ru || p.en);
          if (hasParts && !window.confirm('Убрать все детали набора? Их названия и рецепты будут удалены.')) return;
          delete draft.pieces;
          draft.recipes = draft.recipes || [];
          isSet = false;
          drawRecipeSection();
        } }),
        el('button', { class: 'ed-btn' + (isSet ? ' primary' : ''), type: 'button', text: 'Набор из деталей (броня)', onclick: () => {
          if (isSet) return;
          draft.pieces = [{ ru: '', en: '', recipes: draft.recipes || [] }];
          draft.recipes = [];
          isSet = true;
          drawRecipeSection();
        } })
      ]);
      recipeSection.replaceChildren(
        el('h3', { text: isSet ? 'Рецепт по частям (детали набора)' : 'Рецепт' }),
        modeRow,
        isSet
          ? el('p', { class: 'ed-hint', text: 'У каждой детали можно задать русское и английское название и свой рецепт. Название самого предмета — вверху (поле «Название предмета»).' })
          : null,
        isSet ? piecesEditor(draft.pieces) : recipesEditor(draft.recipes)
      );
    };
    drawRecipeSection();

    const body = el('div', { class: 'modal-body' }, [
      el('section', { class: 'modal-section' }, [
        el('h3', { text: 'Надпись на карточке' }),
        el('p', { class: 'ed-hint', text: 'Это видят все посетители. Название меняется везде, где предмет встречается (во всех классах и этапах). Примечание относится только к этой карточке.' }),
        el('div', { class: 'ed-list' }, [
          field('Название предмета', name, v => { newName = v; refreshPreview(); }, { ph: 'Например: Пальто из флинкса' }),
          alt ? field('Примечание под названием (пусто = без примечания)', noteVal, v => { noteVal = v; refreshPreview(); }, { multiline: true, ph: 'Например: гибридный комплект: платиновый/золотой шлем…' }) : null,
          field('Картинка предмета — ссылка (необязательно)', draft.img || '', v => { draft.img = v.trim(); refreshPreview(); }, { ph: 'https://…/item.png' }),
          preview
        ])
      ]),
      el('h3', { class: 'ed-section-title', text: 'Данные предмета' }),
      el('div', { class: 'ed-grid' }, [
        field('Английское название (вики)', draft.en, v => { draft.en = v; }, { ph: 'Shroomite Bar' }),
        field('Ссылка на вики (необязательно)', draft.wiki, v => { draft.wiki = v; }, { ph: 'https://terraria.wiki.gg/wiki/…' }),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Статус данных' }), statusSel])
      ]),
      field('Описание', draft.description, v => { draft.description = v; }, { multiline: true, ph: 'Краткое описание предмета' }),
      field('Получение (если не крафтится и не падает)', draft.obtain, v => { draft.obtain = v; }, { ph: 'Покупается у Торговца…' }),
      recipeSection,
      el('section', { class: 'modal-section' }, [el('h3', { text: 'Дроп' }), dropsEditor(draft.drops)]),
      el('div', { class: 'ed-actions' }, [
        el('button', { class: 'ed-btn', type: 'button', text: 'Отмена', onclick: closeModal }),
        el('button', { class: 'ed-btn primary', type: 'button', text: 'Применить', onclick: () => {
          const nn = newName.trim();
          if (!nn) { toast('Название не может быть пустым'); return; }
          if (nn !== name && Object.prototype.hasOwnProperty.call(ITEMS, nn)) { toast(`Предмет «${nn}» уже есть. Выбери другое название.`); return; }
          const img = (draft.img || '').trim();
          if (!okImgUrl(img)) { toast('Ссылка на картинку должна начинаться с https://'); return; }
          if (img) draft.img = img; else delete draft.img;
          if (draft.wiki === '' && draft.en) draft.wiki = wikiUrl(draft.en);
          if (!isSet) delete draft.pieces;
          draft.hasDrop = draft.drops.length > 0;
          if (alt) alt.note = noteVal.trim() || null;
          ITEMS[name] = draft;
          let renamed = 0;
          if (nn !== name) renamed = renameItem(name, nn);
          markDirty();
          closeModal();
          renderAll();
          toast(nn !== name
            ? `Название изменено на «${nn}» (карточек: ${renamed}). Не забудь сохранить на GitHub.`
            : 'Изменения применены. Не забудь сохранить на GitHub.');
        } })
      ])
    ]);
    refreshPreview();
    showModal(el('div', { class: 'modal wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': name, style: `--cls:${c.color}` }, [
      el('div', { class: 'modal-head' }, [
        el('div', {}, [el('h2', { text: name }), el('div', { class: 'sub', text: 'Режим редактирования' })]),
        el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Закрыть', text: '×', onclick: closeModal })
      ]),
      body
    ]), { guard: true });
  }

  // ---------- modal plumbing ----------
  function showModal(modal, opts = {}) {
    const root = $('#modal-root');
    root.replaceChildren(modal);
    root.hidden = false;
    root.onclick = (e) => { if (e.target === root && !opts.guard) closeModal(); };
    const btn = modal.querySelector('.modal-close');
    if (btn) btn.focus();
  }
  let onModalClose = null;   // действие после закрытия модалки (например, перерисовать билды)
  function closeModal() {
    const root = $('#modal-root');
    root.hidden = true;
    root.replaceChildren();
    if (onModalClose) { const f = onModalClose; onModalClose = null; f(); }
  }

  // ---------- owner settings + GitHub saving ----------
  function openSettings() {
    const msg = el('p', { class: 'ed-hint' });
    const token = el('input', { class: 'ed-input', type: 'password', placeholder: 'github_pat_…', value: CFG.token || '', autocomplete: 'off' });
    const repo = el('input', { class: 'ed-input', type: 'text', placeholder: 'владелец/репозиторий', value: CFG.repo || '' });
    const branch = el('input', { class: 'ed-input', type: 'text', placeholder: 'main', value: CFG.branch || 'main' });
    const dir = el('input', { class: 'ed-input', type: 'text', placeholder: 'data', value: CFG.dir || 'data' });
    const login = el('input', { class: 'ed-input', type: 'text', placeholder: 'твой логин на GitHub', value: CFG.login || '' });
    const enable = async () => {
      const t = token.value.trim(), r = repo.value.trim();
      if (!t || !r.includes('/')) { msg.textContent = 'Нужны токен и репозиторий вида владелец/репозиторий.'; return; }
      msg.textContent = 'Проверяю токен…';
      try {
        const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' } });
        if (!res.ok) throw new Error(`GitHub ответил ${res.status}`);
        const user = await res.json();
        if (login.value.trim() && user.login.toLowerCase() !== login.value.trim().toLowerCase()) {
          throw new Error(`Токен принадлежит «${user.login}», а не владельцу сайта`);
        }
        const br = branch.value.trim() || 'main';
        const dd = dir.value.trim().replace(/^\/+|\/+$/g, '') || 'data';
        const gh = (path) => fetch('https://api.github.com' + path, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' }, cache: 'no-store' });
        if ((await gh(`/repos/${r}`)).status === 404) throw new Error(`репозиторий «${r}» не найден или у токена нет к нему доступа. Проверь, что написано ровно «владелец/репозиторий» (например, anoba-sss/terraria-builds).`);
        if ((await gh(`/repos/${r}/branches/${encodeURIComponent(br)}`)).status === 404) throw new Error(`ветка «${br}» не найдена в репозитории «${r}».`);
        if ((await gh(`/repos/${r}/contents/${dd}/builds.json?ref=${encodeURIComponent(br)}`)).status === 404) throw new Error(`в папке «${dd}» нет файла builds.json. Проверь поле «Папка с data/*.json».`);
        CFG = { token: t, repo: r, branch: br, dir: dd, login: login.value.trim() || user.login };
        const keepEdits = EDIT && DIRTY;
        saveCfg();
        EDIT = true;
        closeModal();
        renderAll();
        toast(`Режим редактирования включён (${user.login})`);
        if (!keepEdits) loadAll().catch(err => toast(`Не удалось обновить данные из репозитория: ${err.message}`));
      } catch (e) {
        msg.textContent = `Не получилось: ${e.message}`;
      }
    };
    const disable = () => {
      CFG = {};
      saveCfg();
      EDIT = false;
      DIRTY = false;
      closeDesigner();
      closeModal();
      renderAll();
      toast('Режим редактирования выключен');
      loadAll().catch(() => { /* оставляем то, что уже на экране */ });
    };
    showModal(el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Настройки' }, [
      el('div', { class: 'modal-head' }, [
        el('div', {}, [el('h2', { text: 'Настройки редактирования' }), el('div', { class: 'sub', text: 'Только для владельца сайта' })]),
        el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Закрыть', text: '×', onclick: closeModal })
      ]),
      el('div', { class: 'modal-body' }, [
        el('p', { class: 'ed-hint', text: 'Редактирование включается GitHub-токеном владельца. Токен хранится только в этом браузере, сохранение пишет коммит в файлы данных репозитория. Сайт обновится через минуту после коммита. Токен создай как fine-grained с правом «Contents: Read and write» только на этот репозиторий.' }),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Токен (GitHub fine-grained)' }), token]),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Репозиторий' }), repo]),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Ветка' }), branch]),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Папка с data/*.json' }), dir]),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Логин владельца (проверка)' }), login]),
        msg,
        el('div', { class: 'ed-actions' }, [
          EDIT ? el('button', { class: 'ed-btn', type: 'button', text: '🧭 Этапы подготовки', onclick: () => { closeModal(); openStagesEditor(); } }) : null,
          EDIT ? el('button', { class: 'ed-btn', type: 'button', text: '🎨 Оформление сайта', onclick: () => { closeModal(); openDesigner(); } }) : null,
          CFG.token ? el('button', { class: 'ed-btn danger', type: 'button', text: 'Выключить редактирование', onclick: disable }) : null,
          el('button', { class: 'ed-btn primary', type: 'button', text: EDIT ? 'Обновить настройки' : 'Включить редактирование', onclick: enable })
        ])
      ])
    ]));
  }

  // ---------- редактор этапов подготовки (только владелец) ----------
  // Меняет надписи этапов, боссов под надписью, порядок, добавляет и удаляет этапы.
  // Предметы внутри этапа редактируются в самом билде, как и раньше.
  function openStagesEditor() {
    let cls = currentClass();
    const bossIds = Object.keys(BOSS_NAMES);
    const stagesOf = () => (Array.isArray(DATA.builds[cls]) ? DATA.builds[cls] : (DATA.builds[cls] = []));
    const itemCount = (st) => CATS.reduce((n, c) => n + ((st.cats && st.cats[c.id]) || []).length, 0);
    const touch = () => markDirty();

    const tabsBox = el('div', { class: 'stage-class-tabs', role: 'tablist' });
    const summary = el('p', { class: 'ed-hint' });
    const listBox = el('div', { class: 'ed-list' });
    const newTitle = el('input', { class: 'ed-input', type: 'text', placeholder: 'Надпись нового этапа, например «Подготовка к Глазу Ктулху»' });

    function bossPicker(stage) {
      return el('div', { class: 'stg-bosses' }, bossIds.map(id => {
        const input = el('input', { type: 'checkbox' });
        input.checked = stage.bosses.includes(id);
        input.addEventListener('change', () => {
          const i = stage.bosses.indexOf(id);
          if (input.checked && i < 0) stage.bosses.push(id);
          if (!input.checked && i >= 0) stage.bosses.splice(i, 1);
          touch();
          renderStages();   // обновить счётчики и подписи сверху
        });
        return el('label', { class: 'stg-boss' }, [input, el('span', { text: bossName(id) })]);
      }));
    }

    function move(list, i, d) {
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      touch();
      renderStages();
    }

    function stageCard(stage, i, list) {
      const title = el('input', { class: 'ed-input stg-title', type: 'text', 'aria-label': `Надпись этапа ${i + 1}` });
      title.value = stage.title;
      title.addEventListener('input', () => {
        const v = title.value.trim();
        if (v) { stage.title = v; touch(); }
      });
      const bossesNow = stage.bosses.map(b => bossName(b)).join(', ') || 'боссы не выбраны';
      return el('div', { class: 'ed-card stg-card' }, [
        el('div', { class: 'stg-head' }, [
          el('span', { class: 'stage-num', text: String(i + 1) }),
          title
        ]),
        el('div', { class: 'stg-meta' }, [
          el('span', { class: 'ed-hint', text: `Боссы: ${bossesNow} · предметов: ${itemCount(stage)}` }),
          el('div', { class: 'stg-actions' }, [
            el('button', { class: 'ed-btn small', type: 'button', text: '↑', title: 'Поднять этап', 'aria-label': 'Поднять этап', disabled: i === 0 ? true : null, onclick: () => move(list, i, -1) }),
            el('button', { class: 'ed-btn small', type: 'button', text: '↓', title: 'Опустить этап', 'aria-label': 'Опустить этап', disabled: i === list.length - 1 ? true : null, onclick: () => move(list, i, 1) }),
            el('button', { class: 'ed-btn small danger', type: 'button', text: 'Удалить', onclick: () => {
              if (!confirm(`Удалить этап «${stage.title}» вместе с его предметами?`)) return;
              list.splice(i, 1);
              touch();
              renderStages();
              toast('Этап удалён');
            } })
          ])
        ]),
        el('div', { class: 'ed-section-title', text: 'Боссы этапа' }),
        bossPicker(stage)
      ]);
    }

    function renderTabs() {
      tabsBox.replaceChildren(...ORDER.map(k => el('button', {
        class: 'class-btn', type: 'button', role: 'tab',
        'aria-current': k === cls ? 'page' : null, style: `--cls:${CLASSES[k].color}`,
        onclick: () => { cls = k; renderTabs(); renderStages(); }
      }, [el('span', { class: 'class-dot' }), CLASSES[k].name])));
    }

    function renderStages() {
      const list = stagesOf();
      summary.textContent = `${CLASSES[cls].name}: этапов ${list.length}. Надписи и боссы сохраняются вместе с билдами (кнопка «Сохранить на GitHub»).`;
      listBox.replaceChildren(...(list.length
        ? list.map((s, i) => stageCard(s, i, list))
        : [el('p', { class: 'empty', text: 'У этого класса пока нет этапов. Добавь первый ниже.' })]));
    }

    const addBtn = el('button', { class: 'ed-btn primary', type: 'button', text: '+ Добавить этап', onclick: () => {
      const t = newTitle.value.trim();
      if (!t) { toast('Введи надпись этапа'); return; }
      stagesOf().push({ title: t, bosses: [], cats: { armor: [], weapons: [], accessories: [], buffs: [] } });
      newTitle.value = '';
      touch();
      renderStages();
      toast(`Этап «${t}» добавлен в конец. Отметь боссы под надписью.`);
    } });
    newTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

    onModalClose = () => renderAll();
    showModal(el('div', { class: 'modal wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Этапы подготовки' }, [
      el('div', { class: 'modal-head' }, [
        el('div', {}, [el('h2', { text: 'Этапы подготовки' }), el('div', { class: 'sub', text: 'Надписи этапов, боссы под ними, порядок. Предметы — в самом билде.' })]),
        el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Закрыть', text: '×', onclick: closeModal })
      ]),
      el('div', { class: 'modal-body' }, [
        tabsBox,
        summary,
        listBox,
        el('div', { class: 'ed-card add-entry' }, [
          el('div', { class: 'add-title', text: '+ Новый этап' }),
          newTitle,
          el('div', { class: 'ed-actions' }, [addBtn])
        ])
      ])
    ]));
    renderTabs();
    renderStages();
  }

  function renderSaveBar() {
    const dz = $('#dz-state');
    if (dz) dz.textContent = DIRTY ? 'Есть несохранённые изменения' : 'Все изменения сохранены на GitHub';
    let bar = $('#savebar');
    if (!bar) { bar = el('div', { id: 'savebar', class: 'savebar', role: 'region', 'aria-label': 'Сохранение' }); document.body.append(bar); }
    if (!EDIT || !DIRTY) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.replaceChildren(
      el('span', { text: 'Есть несохранённые изменения' }),
      el('button', { class: 'ed-btn primary', type: 'button', text: 'Сохранить на GitHub', onclick: saveAll }),
      el('button', { class: 'ed-btn', type: 'button', text: 'Отменить все', onclick: () => { if (confirm('Отменить все несохранённые изменения?')) location.reload(); } })
    );
  }

  function b64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  async function putFile(path, text, message, allowCreate) {
    const url = `https://api.github.com/repos/${CFG.repo}/contents/${path}`;
    const headers = { Authorization: `Bearer ${CFG.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
    // no-store: иначе браузер может отдать устаревший sha и вторая подряд запись упадёт с 409
    const get = await fetch(`${url}?ref=${encodeURIComponent(CFG.branch)}`, { headers, cache: 'no-store' });
    let sha;
    if (get.ok) {
      sha = (await get.json()).sha;
    } else if (get.status === 404 && allowCreate) {
      sha = undefined;   // файла ещё нет — создадим
    } else {
      let detail = '';
      try { detail = (await get.json()).message || ''; } catch (e) { /* ignore */ }
      throw new Error(`чтение ${CFG.repo}@${CFG.branch}/${path}: ${get.status} ${detail}`.trim());
    }
    const payload = { message, content: b64(text), branch: CFG.branch };
    if (sha) payload.sha = sha;
    const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
    if (!put.ok) {
      let detail = '';
      try { detail = (await put.json()).message || ''; } catch (e) { /* ignore */ }
      throw new Error(`запись ${path}: ${put.status} ${detail}`.trim());
    }
    const res = await put.json();
    return res && res.commit ? res.commit : null;
  }

  async function saveAll() {
    if (!EDIT || SAVING) return;
    const files = [
      { name: 'builds.json', text: serJson(DATA), msg: 'Обновление билдов (редактор сайта)' },
      { name: 'items.json', text: serJson(ITEMS), msg: 'Обновление предметов (редактор сайта)' },
      { name: 'site.json', text: serSite(), msg: 'Обновление оформления сайта (редактор сайта)', create: true }
    ];
    const changed = files.filter(f => f.text !== SNAP[f.name]);
    if (!changed.length) { DIRTY = false; renderSaveBar(); toast('Нет изменений для сохранения.'); return; }
    SAVING = true;
    toast('Сохраняю…');
    try {
      let last = null;
      for (const f of changed) {
        last = await putFile(`${CFG.dir}/${f.name}`, f.text, f.msg, f.create);
        SNAP[f.name] = f.text;
      }
      DIRTY = false;
      renderSaveBar();
      saveSiteCache();
      const where = `${CFG.repo}@${CFG.branch}/${CFG.dir}` + (last && last.sha ? ` (коммит ${last.sha.slice(0, 7)})` : '');
      toast(`Сохранено (${changed.map(f => f.name).join(', ')}): ${where}. Сайт обновится через 1–2 минуты.`);
      console.info('Saved to', where, last && last.html_url);
    } catch (e) {
      toast(`Ошибка сохранения: ${e.message}`);
    } finally {
      SAVING = false;
    }
  }

  // ---------- appearance designer (owner only) ----------
  const DZ = { open: false, tab: 'themes', el: null };
  const DZ_TABS = [['themes', 'Темы'], ['colors', 'Цвета'], ['fonts', 'Шрифты'], ['layout', 'Макет'], ['bg', 'Фон'], ['texts', 'Тексты'], ['show', 'Показ'], ['css', 'CSS'], ['file', 'Файл']];
  const mk = (name, theme, c) => ({ id: name, name, theme, colors: c });
  const PRESETS = [
    { id: 'default', name: 'Стандартная', theme: null, colors: null, swatch: ['#15110e', '#211a15', '#e9b44c', '#f1e7d6'] },
    mk('Тёмное дерево', 'dark', { bg: '#15110e', panel: '#211a15', panel2: '#2b221c', line: '#3f3229', text: '#f1e7d6', muted: '#b9a88f', accent: '#e9b44c', cls: '#e9b44c', ok: '#7fd1a0', warn: '#f2c14e' }),
    mk('Светлый пергамент', 'light', { bg: '#f6efe3', panel: '#fffaf1', panel2: '#f1e6d3', line: '#dccbb1', text: '#2b2118', muted: '#6e5d4a', accent: '#a86b12', cls: '#a86b12', ok: '#2f7d4f', warn: '#8a6100' }),
    mk('Лес', 'dark', { bg: '#0f1a14', panel: '#16261d', panel2: '#1d3226', line: '#2f4a39', text: '#e6f2e8', muted: '#9db8a5', accent: '#7fd17f', cls: '#7fd17f', ok: '#7fd1a0', warn: '#e6c84f' }),
    mk('Океан', 'dark', { bg: '#0b1622', panel: '#112334', panel2: '#17304a', line: '#274a6b', text: '#e4f0fa', muted: '#8fb0cc', accent: '#4fb6e8', cls: '#4fb6e8', ok: '#6fd6b0', warn: '#f0cf6a' }),
    mk('Багровая луна', 'dark', { bg: '#1a0d10', panel: '#26141a', panel2: '#331b23', line: '#55303b', text: '#f6e4e6', muted: '#c39aa3', accent: '#e0505f', cls: '#e0505f', ok: '#7fd1a0', warn: '#f2c14e' }),
    mk('Порча (фиолетовая)', 'dark', { bg: '#130e1d', panel: '#1d1530', panel2: '#281d42', line: '#433463', text: '#ece6fa', muted: '#b0a3d0', accent: '#a77bf0', cls: '#a77bf0', ok: '#7fd1a0', warn: '#f2c14e' }),
    mk('Хардмод (розово-голубая)', 'dark', { bg: '#14121f', panel: '#1d1a2e', panel2: '#272340', line: '#3c3763', text: '#f0ecff', muted: '#aaa4d0', accent: '#ff7ac8', cls: '#5fd0ff', ok: '#7fe0b0', warn: '#ffd166' }),
    mk('Пустыня', 'light', { bg: '#f3e6c8', panel: '#fbf3df', panel2: '#ecdcb4', line: '#d3bd8a', text: '#3a2a10', muted: '#7a643a', accent: '#c27a14', cls: '#c27a14', ok: '#3c7d44', warn: '#9a6a00' }),
    mk('Снежная', 'light', { bg: '#eaf2f8', panel: '#ffffff', panel2: '#dde9f3', line: '#bcd0e0', text: '#17283a', muted: '#55708a', accent: '#2f7fc1', cls: '#2f7fc1', ok: '#2c8a5f', warn: '#9a6f00' }),
    mk('Чёрная (OLED)', 'dark', { bg: '#000000', panel: '#0d0d0d', panel2: '#161616', line: '#2a2a2a', text: '#f2f2f2', muted: '#9a9a9a', accent: '#ffb347', cls: '#ffb347', ok: '#7fd1a0', warn: '#f2c14e' })
  ];
  PRESETS.forEach(p => { if (!p.swatch) p.swatch = [p.colors.bg, p.colors.panel, p.colors.accent, p.colors.text]; });

  // --- чтение текущих цветов и проверка контраста ---
  const readVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const effHex = (k) => getPath(SITE, 'colors.' + k) || cleanVal({ t: 'hex' }, readVar(COLOR_VARS[k])) || '#000000';
  function lum(hex) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a, b) {
    const la = lum(a), lb = lum(b);
    if (la == null || lb == null) return null;
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function updateContrast() {
    const box = $('#dz-contrast');
    if (!box) return;
    const t = effHex('text'), bg = effHex('bg'), pn = effHex('panel'), mu = effHex('muted'), ac = effHex('accent');
    const rows = [['Текст на фоне', t, bg], ['Текст на панелях', t, pn], ['Приглушённый текст', mu, pn], ['Ссылки и акценты', ac, pn]];
    box.replaceChildren(...rows.map(([label, a, b]) => {
      const r = contrast(a, b);
      const ok = r != null && r >= 4.5;
      return el('div', { class: ok ? 'dz-good' : 'dz-warn', text: `${ok ? '✓' : '⚠'} ${label}: контраст ${r == null ? '?' : r.toFixed(1)}:1${ok ? '' : ' — читается плохо'}` });
    }));
  }

  // --- изменение настроек ---
  function onSite(path) {
    markDirty();
    applySite();
    if (/^(texts|classColors|layout\.stageColor)/.test(path || '')) renderAll();
    updateContrast();
  }
  function setS(path, val) {
    if (val === undefined || val === null || val === '') delPath(SITE, path); else setPath(SITE, path, val);
    onSite(path);
  }

  // --- маленькие конструкторы элементов ---
  function dzRow(label, nodes, path) {
    const reset = path ? el('button', {
      class: 'dz-reset', type: 'button', title: 'Сбросить к стандартному', 'aria-label': 'Сбросить: ' + label, text: '↺',
      onclick: () => { delPath(SITE, path); onSite(path); renderDesigner(); }
    }) : null;
    return el('div', { class: 'dz-ctl' }, [el('div', { class: 'dz-lab', text: label }), el('div', { class: 'dz-field' }, [...nodes, reset])]);
  }
  const dzH = (text) => el('h4', { class: 'dz-h', text });
  const dzHint = (text) => el('p', { class: 'dz-hint', text });
  const fmtNum = (spec, v) => `${v}${spec.unit || ''}`;

  function dzColor(label, path, getDef) {
    const cur = () => getPath(SITE, path) || getDef();
    const pick = el('input', { type: 'color', class: 'dz-color', 'aria-label': label });
    const txt = el('input', { type: 'text', class: 'dz-input dz-hex', maxlength: '7', spellcheck: 'false', 'aria-label': label + ' (hex)' });
    pick.value = cur();
    txt.value = cur();
    pick.addEventListener('input', () => { txt.value = pick.value; txt.classList.remove('bad'); setS(path, pick.value); });
    txt.addEventListener('input', () => {
      const c = cleanVal({ t: 'hex' }, txt.value);
      if (c) { pick.value = c; txt.classList.remove('bad'); setS(path, c); } else txt.classList.add('bad');
    });
    return dzRow(label, [pick, txt], path);
  }
  function dzRange(label, path) {
    const spec = SPEC[path];
    const cur = () => (typeof getPath(SITE, path) === 'number' ? getPath(SITE, path) : spec.def);
    const inp = el('input', { type: 'range', class: 'dz-range', min: spec.min, max: spec.max, step: spec.step, 'aria-label': label });
    const out = el('output', { class: 'dz-out' });
    inp.value = cur();
    out.textContent = fmtNum(spec, cur());
    inp.addEventListener('input', () => {
      const v = Number(inp.value);
      out.textContent = fmtNum(spec, v);
      setS(path, v === spec.def ? undefined : v);
    });
    return dzRow(label, [inp, out], path);
  }
  function dzSelect(label, path, options, rebuild) {
    const spec = SPEC[path];
    const cur = String(getPath(SITE, path) ?? (spec.def ?? ''));
    const sel = el('select', { class: 'dz-input', 'aria-label': label }, options.map(([v, l]) => el('option', { value: v, text: l })));
    sel.value = cur;
    sel.addEventListener('change', () => {
      const v = sel.value;
      setS(path, v === '' || (spec.def !== undefined && v === String(spec.def)) ? undefined : v);
      if (rebuild) renderDesigner();
    });
    return dzRow(label, [sel], path);
  }
  function dzToggle(label, path) {
    const spec = SPEC[path];
    const cur = typeof getPath(SITE, path) === 'boolean' ? getPath(SITE, path) : spec.def;
    const box = el('input', { type: 'checkbox', 'aria-label': label });
    box.checked = cur;
    box.addEventListener('change', () => setS(path, box.checked === spec.def ? undefined : box.checked));
    const row = el('div', { class: 'dz-ctl' }, [el('div', { class: 'dz-field' }, [
      el('label', { class: 'dz-toggle' }, [box, el('span', { text: label })]),
      el('button', { class: 'dz-reset', type: 'button', title: 'Сбросить к стандартному', 'aria-label': 'Сбросить: ' + label, text: '↺', onclick: () => { delPath(SITE, path); onSite(path); renderDesigner(); } })
    ])]);
    return row;
  }
  function dzText(label, path, ph, multiline) {
    const spec = SPEC[path];
    const inp = el(multiline ? 'textarea' : 'input', Object.assign({ class: 'dz-input', placeholder: ph || '', 'aria-label': label, maxlength: spec && spec.max ? spec.max : null }, multiline ? { rows: 3 } : { type: 'text' }));
    inp.value = getPath(SITE, path) || '';
    inp.addEventListener('input', () => setS(path, inp.value));
    return dzRow(label, [inp], path);
  }
  const fontOptions = () => [['', 'По умолчанию'], ...Object.keys(SYSTEM_STACKS).map(n => [n, n]), ...Object.keys(FONTS).map(n => [n, n])];
  const weightOptions = () => WEIGHTS.map(w => [w, { 400: 'Обычный (400)', 500: 'Средний (500)', 600: 'Полужирный (600)', 700: 'Жирный (700)', 800: 'Очень жирный (800)', 900: 'Чёрный (900)' }[w]]);

  // --- вкладки ---
  function applyPreset(p) {
    delPath(SITE, 'colors');
    delPath(SITE, 'theme');
    if (p.colors) {
      COLOR_KEYS.forEach(k => { if (p.colors[k]) setPath(SITE, 'colors.' + k, p.colors[k]); });
      setPath(SITE, 'theme', p.theme);
    }
    onSite('colors');
    renderDesigner();
    toast(`Тема «${p.name}» применена`);
  }
  function tabThemes() {
    return [
      dzH('Готовые темы'),
      dzHint('Тема заменяет всю палитру сразу. После этого любой цвет можно поправить во вкладке «Цвета».'),
      el('div', { class: 'dz-presets' }, PRESETS.map(p => el('button', { class: 'dz-preset', type: 'button', onclick: () => applyPreset(p) }, [
        el('span', { class: 'dz-sw' }, p.swatch.map(c => el('i', { style: `background:${c}` }))),
        el('span', { text: p.name })
      ]))),
      dzH('Светлая или тёмная'),
      dzSelect('Режим сайта', 'theme', [['auto', 'Как в системе у посетителя'], ['light', 'Всегда светлая'], ['dark', 'Всегда тёмная']])
    ];
  }
  function tabColors() {
    const names = { bg: 'Фон страницы', panel: 'Панели этапов, окна', panel2: 'Карточки, вкладки, шапки', line: 'Линии и рамки', text: 'Основной текст', muted: 'Приглушённый текст', accent: 'Ссылки и акценты', cls: 'Выделение (номера этапов, вкладки)', ok: 'Статус «проверено»', warn: 'Статус «частично»' };
    return [
      dzH('Палитра сайта'),
      ...COLOR_KEYS.map(k => dzColor(names[k], 'colors.' + k, () => cleanVal({ t: 'hex' }, readVar(COLOR_VARS[k])) || '#000000')),
      dzH('Цвета классов'),
      dzHint('Цвет кнопки класса, рамки при наведении и шапки раздела.'),
      ...ORDER.map(k => dzColor(CLASS_DEFAULTS[k].name, 'classColors.' + k, () => CLASS_DEFAULTS[k].color)),
      dzH('Проверка читаемости'),
      el('div', { id: 'dz-contrast', class: 'dz-hint' })
    ];
  }
  function tabFonts() {
    return [
      dzH('Шрифты'),
      dzHint('Шрифты подгружаются с Google Fonts. Все они поддерживают кириллицу.'),
      dzSelect('Основной текст', 'fonts.body', fontOptions()),
      dzSelect('Заголовки (логотип, название класса, номера этапов)', 'fonts.head', fontOptions()),
      dzSelect('Названия этапов и окон', 'fonts.title', fontOptions()),
      dzH('Размер и начертание'),
      dzRange('Размер текста сайта', 'type.size'),
      dzRange('Межстрочный интервал', 'type.lineHeight'),
      dzRange('Размер названия предмета на карточке', 'type.nameSize'),
      dzRange('Размер примечания на карточке', 'type.noteSize'),
      dzSelect('Толщина заголовков', 'type.headWeight', weightOptions()),
      dzSelect('Толщина названий этапов', 'type.titleWeight', weightOptions()),
      dzSelect('Регистр заголовков', 'type.headCase', [['none', 'Как написано'], ['uppercase', 'ПРОПИСНЫЕ']])
    ];
  }
  function tabLayout() {
    return [
      dzH('Размеры'),
      dzRange('Ширина страницы', 'layout.width'),
      dzRange('Минимальная ширина карточки', 'layout.cardMin'),
      dzRange('Расстояние между карточками', 'layout.gap'),
      dzRange('Отступ внутри карточки', 'layout.cardPad'),
      dzRange('Отступ внутри панели этапа', 'layout.panelPad'),
      dzRange('Расстояние между этапами', 'layout.stageGap'),
      dzRange('Отступ внутри шапки раздела', 'layout.heroPad'),
      dzH('Форма и стиль'),
      dzRange('Скругление углов', 'layout.radius'),
      dzRange('Толщина рамок', 'layout.border'),
      dzRange('Сила тени', 'layout.shadow'),
      dzSelect('Форма кнопок классов', 'layout.navShape', [['pill', 'Таблетка'], ['round', 'Скруглённая'], ['square', 'Квадратная']]),
      dzSelect('Цвет выделения этапов', 'layout.stageColor', [['default', 'Общий (как сейчас)'], ['class', 'По цвету класса']]),
      dzH('Поведение'),
      dzToggle('Верхняя панель закреплена при прокрутке', 'layout.sticky'),
      dzToggle('Плавные переходы и анимации', 'anim.enabled'),
      dzToggle('Карточка «приподнимается» при наведении', 'anim.lift')
    ];
  }
  function tabBg() {
    const mode = getPath(SITE, 'bg.mode') || 'default';
    const out = [
      dzH('Фон страницы'),
      dzSelect('Тип фона', 'bg.mode', [['default', 'Стандартный (мягкое свечение)'], ['plain', 'Сплошной цвет'], ['gradient', 'Градиент'], ['pattern', 'Узор'], ['image', 'Картинка']], true)
    ];
    if (mode === 'plain') out.push(dzHint('Цвет задаётся во вкладке «Цвета» → «Фон страницы».'));
    if (mode === 'gradient') out.push(
      dzColor('Цвет 1', 'bg.c1', () => effHex('panel2')),
      dzColor('Цвет 2', 'bg.c2', () => effHex('bg')),
      dzRange('Угол градиента', 'bg.angle'),
      dzToggle('Фон неподвижен при прокрутке', 'bg.fixed'));
    if (mode === 'pattern') out.push(
      dzSelect('Узор', 'bg.pattern', [['dots', 'Точки'], ['grid', 'Сетка'], ['stripes', 'Полосы'], ['cross', 'Ромбы']]),
      dzColor('Цвет узора', 'bg.c1', () => effHex('text')),
      dzRange('Размер ячейки', 'bg.patternSize'),
      dzRange('Яркость узора', 'bg.patternAlpha'),
      dzToggle('Фон неподвижен при прокрутке', 'bg.fixed'));
    if (mode === 'image') out.push(
      dzText('Ссылка на картинку', 'bg.url', 'https://…/background.jpg'),
      dzHint('Ссылка должна начинаться с https:// (или путь к файлу в репозитории, например images/bg.jpg). Без пробелов и скобок.'),
      dzRange('Затемнение поверх картинки', 'bg.overlay'),
      dzToggle('Фон неподвижен при прокрутке', 'bg.fixed'));
    return out;
  }
  function tabTexts() {
    const D = TEXT_DEFAULTS;
    const classBlocks = ORDER.map(k => el('details', { class: 'dz-det' }, [
      el('summary', { text: CLASS_DEFAULTS[k].name }),
      dzText('Название класса', `texts.classes.${k}.name`, CLASS_DEFAULTS[k].name),
      dzText('Описание под названием', `texts.classes.${k}.blurb`, CLASS_DEFAULTS[k].blurb, true)
    ]));
    return [
      dzH('Шапка сайта'),
      dzText('Значок логотипа', 'texts.brandMark', D.brandMark),
      dzText('Название сайта', 'texts.brandName', D.brandName),
      dzText('Подпись под названием', 'texts.brandTag', D.brandTag),
      dzText('Заголовок вкладки браузера', 'texts.pageTitle', DEFAULT_TITLE),
      dzH('Классы'),
      ...classBlocks,
      dzText('Надпись над названием класса', 'texts.eyebrow', D.eyebrow),
      dzH('Разделы билда'),
      ...CATS.map(c => dzText(`Вкладка «${c.name}»`, 'texts.cats.' + c.id, c.name)),
      dzText('Подсказка над списком ({cat} — название вкладки)', 'texts.hint', D.hint, true),
      dzText('Если в категории пусто', 'texts.empty', D.empty),
      dzH('Обозначения'),
      dzText('Легенда: проверено', 'texts.legendOk', D.legendOk),
      dzText('Легенда: частично', 'texts.legendPartial', D.legendPartial),
      dzText('Легенда: нет данных', 'texts.legendNone', D.legendNone),
      dzText('Статус в окне: проверено', 'texts.status.ok', STATUS_DEFAULT.ok),
      dzText('Статус в окне: частично', 'texts.status.partial', STATUS_DEFAULT.partial),
      dzText('Статус в окне: нет данных', 'texts.status.none', STATUS_DEFAULT.none),
      dzH('Подвал'),
      dzText('Текст подвала (пусто = стандартный)', 'texts.footer', 'Фанатский справочник…', true),
      dzText('Текст ссылки в подвале', 'texts.footerLinkText', 'Terraria Wiki'),
      dzText('Адрес ссылки в подвале', 'texts.footerLinkUrl', 'https://terraria.wiki.gg/ru/'),
      dzH('Названия боссов'),
      el('details', { class: 'dz-det' }, [
        el('summary', { text: 'Показать все названия' }),
        ...Object.keys(BOSS_NAMES).map(id => dzText(BOSS_NAMES[id], 'texts.bosses.' + id, BOSS_NAMES[id]))
      ])
    ];
  }
  function tabShow() {
    return [
      dzH('Что показывать на сайте'),
      dzToggle('Шапка раздела с названием класса', 'show.hero'),
      dzToggle('Свечение в шапке раздела', 'show.heroGlow'),
      dzToggle('Надпись над названием класса', 'show.eyebrow'),
      dzToggle('Легенда статусов', 'show.legend'),
      dzToggle('Номера этапов', 'show.stageNum'),
      dzToggle('Названия боссов под заголовком этапа', 'show.bossChips'),
      dzToggle('Счётчики на вкладках', 'show.counts'),
      dzToggle('Подсказка над списком предметов', 'show.panelHint'),
      dzToggle('Цветные точки статуса на карточках', 'show.statusDots'),
      dzToggle('Примечания на карточках', 'show.notes'),
      dzToggle('Значок логотипа', 'show.brandMark'),
      dzToggle('Подпись под названием сайта', 'show.brandTag'),
      dzToggle('Подвал сайта', 'show.footer'),
      dzSelect('Место под картинку предмета', 'show.imgSlot', [['always', 'Всегда (пустая рамка, если картинки нет)'], ['withimg', 'Только у предметов с картинкой'], ['never', 'Не показывать']])
    ];
  }
  function tabCss() {
    const ta = el('textarea', { class: 'dz-input dz-css', spellcheck: 'false', rows: 12, 'aria-label': 'Свой CSS', placeholder: '.item-btn { border-width: 2px; }' });
    ta.value = getPath(SITE, 'css') || '';
    ta.addEventListener('input', () => setS('css', ta.value));
    return [
      dzH('Свой CSS'),
      dzHint('Для тех, кому не хватило настроек. Код применяется ко всем посетителям поверх остального оформления.'),
      ta,
      dzHint('Если после правок сайт стал нечитаемым, открой его с адресом ...?safe=1 — тогда цвета, фон, макет и свой CSS не применяются, и всё можно исправить.')
    ];
  }
  function exportSite() {
    const blob = new Blob([serSite()], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = el('a', { href, download: 'site.json' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 2000);
  }
  function importSite(file) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        SITE = sanitizeSite(JSON.parse(String(rd.result)));
      } catch (e) {
        toast('Не удалось прочитать файл: это не JSON.');
        return;
      }
      onSite('texts');
      renderDesigner();
      toast('Настройки загружены. Проверь результат и сохрани на GitHub.');
    };
    rd.readAsText(file);
  }
  function tabFile() {
    const picker = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
    picker.addEventListener('change', () => { if (picker.files && picker.files[0]) importSite(picker.files[0]); picker.value = ''; });
    return [
      dzH('Резервная копия оформления'),
      dzHint('Сохрани настройки в файл или загрузи ранее сохранённые. Файл data/site.json в репозитории — это то же самое.'),
      el('div', { class: 'dz-row' }, [
        el('button', { class: 'dz-btn', type: 'button', text: 'Скачать настройки', onclick: exportSite }),
        el('button', { class: 'dz-btn', type: 'button', text: 'Загрузить из файла', onclick: () => picker.click() }),
        picker
      ]),
      dzH('Сброс'),
      dzHint('Вернёт оформление к стандартному. На GitHub это попадёт только после сохранения.'),
      el('div', { class: 'dz-row' }, [
        el('button', { class: 'dz-btn danger', type: 'button', text: 'Сбросить всё оформление', onclick: () => {
          if (!confirm('Сбросить всё оформление к стандартному?')) return;
          SITE = { v: 1 };
          onSite('texts');
          renderDesigner();
          toast('Оформление сброшено. Нажми «Сохранить на GitHub», чтобы применить для всех.');
        } })
      ])
    ];
  }
  function revertSite() {
    if (!confirm('Вернуть оформление к последнему сохранённому на GitHub варианту?')) return;
    try { SITE = sanitizeSite(JSON.parse(SNAP['site.json'] || '{}')); } catch (e) { SITE = { v: 1 }; }
    DIRTY = serJson(DATA) !== SNAP['builds.json'] || serJson(ITEMS) !== SNAP['items.json'];
    applySite();
    renderAll();
    renderDesigner();
    toast('Оформление возвращено к сохранённому.');
  }

  // --- сама панель ---
  function ensureDesigner() {
    if (DZ.el) return DZ.el;
    DZ.el = el('aside', { id: 'designer', class: 'designer', 'aria-label': 'Оформление сайта', hidden: true }, [
      el('div', { class: 'dz-head' }, [
        el('strong', { text: '🎨 Оформление сайта' }),
        el('button', { class: 'dz-x', type: 'button', 'aria-label': 'Закрыть панель', text: '×', onclick: closeDesigner })
      ]),
      el('div', { class: 'dz-tabs', role: 'tablist' }),
      el('div', { class: 'dz-body' }),
      el('div', { class: 'dz-foot' }, [
        el('div', { id: 'dz-state', class: 'dz-state' }),
        el('button', { class: 'dz-btn primary', type: 'button', text: 'Сохранить на GitHub', onclick: saveAll }),
        el('button', { class: 'dz-btn', type: 'button', text: 'Вернуть сохранённое', onclick: revertSite })
      ])
    ]);
    document.body.append(DZ.el);
    return DZ.el;
  }
  function renderDesigner() {
    if (!DZ.el) return;
    const tabs = $('.dz-tabs', DZ.el), body = $('.dz-body', DZ.el);
    tabs.replaceChildren(...DZ_TABS.map(([id, label]) => el('button', {
      class: 'dz-tab', type: 'button', role: 'tab', 'aria-selected': id === DZ.tab ? 'true' : 'false', text: label,
      onclick: () => { DZ.tab = id; renderDesigner(); body.scrollTop = 0; }
    })));
    const builders = { themes: tabThemes, colors: tabColors, fonts: tabFonts, layout: tabLayout, bg: tabBg, texts: tabTexts, show: tabShow, css: tabCss, file: tabFile };
    const nodes = (builders[DZ.tab] || tabThemes)();
    if (SAFE) nodes.unshift(el('p', { class: 'dz-hint dz-warn', text: 'Безопасный режим (?safe=1): цвета, фон, макет и свой CSS на этой странице не применяются. Настройки можно менять и сохранять, но результат смотри на обычном адресе сайта.' }));
    body.replaceChildren(...nodes);
    renderSaveBar();
    updateContrast();
  }
  function openDesigner() {
    if (!EDIT) { toast('Сначала включи режим редактирования: шестерёнка ⚙ → токен GitHub.'); return; }
    ensureDesigner().hidden = false;
    DZ.open = true;
    document.body.classList.add('designer-open');
    renderDesigner();
  }
  function closeDesigner() {
    DZ.open = false;
    if (DZ.el) DZ.el.hidden = true;
    document.body.classList.remove('designer-open');
  }

  // ---------- wiring ----------
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', renderAll);
  window.addEventListener('beforeunload', (e) => { if (DIRTY) { e.preventDefault(); e.returnValue = ''; } });
  $('#settings-btn').addEventListener('click', openSettings);

  // Pages отдаёт JSON с кэшем (~10 мин) — после «Сохранить» страница показывала старые данные.
  // Владелец читает файлы напрямую из репозитория (всегда свежие), остальные — с обходом кэша.
  function plainJson(name) {
    return fetch(`data/${name}?v=${Date.now()}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`${name}: ${r.status}`); return r.json(); });
  }
  function repoJson(name) {
    const url = `https://api.github.com/repos/${CFG.repo}/contents/${CFG.dir}/${name}?ref=${encodeURIComponent(CFG.branch)}`;
    return fetch(url, { cache: 'no-store', headers: { Authorization: `Bearer ${CFG.token}`, Accept: 'application/vnd.github.raw+json' } })
      .then(r => { if (!r.ok) throw new Error(`${name}: ${r.status}`); return r.json(); });
  }
  function loadJson(name, fallback) {
    const p = EDIT
      ? repoJson(name).catch(err => { console.warn('GitHub read failed, falling back to site copy:', err); return plainJson(name); })
      : plainJson(name);
    return fallback === undefined ? p : p.catch(() => fallback);
  }
  function loadAll() {
    return Promise.all([loadJson('builds.json'), loadJson('items.json'), loadJson('site.json', {})]).then(([builds, items, site]) => {
      DATA = builds;
      ITEMS = items;
      SITE = sanitizeSite(site);
      SNAP['builds.json'] = serJson(DATA);
      SNAP['items.json'] = serJson(ITEMS);
      SNAP['site.json'] = serSite();
      saveSiteCache();
      applySite();
      renderAll();
      if (DZ.open) renderDesigner();
    });
  }

  if (!$('#design-btn')) {   // на случай, если index.html остался старым
    const sb = $('#settings-btn');
    sb.parentNode.insertBefore(el('button', { class: 'gear-btn', id: 'design-btn', type: 'button', 'aria-label': 'Оформление сайта', title: 'Оформление сайта', text: '🎨', hidden: true }), sb);
  }
  $('#design-btn').addEventListener('click', () => { if (DZ.open) closeDesigner(); else openDesigner(); });
  $('#design-btn').hidden = !EDIT;
  applySite();   // сразу применяем сохранённое в браузере оформление, чтобы страница не мигала
  loadAll().catch(err => {
    $('#app').replaceChildren(el('p', { class: 'empty', text: 'Не удалось загрузить данные. Открой сайт через локальный сервер или GitHub Pages.' }));
    console.error(err);
  });
})();
