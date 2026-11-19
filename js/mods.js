(() => {
  'use strict';
  // Выбор мода: Terraria (по умолчанию), Calamity, Fargo's.
  // У каждого мода свои данные: data/mods/<мод>-builds.json и data/mods/<мод>-items.json.
  // Редактор владельца работает как обычно, но читает и сохраняет файлы выбранного мода.
  // Панель выбора мода стоит отдельным блоком справа от шапки класса (.hero-row).
  // Мод переключается БЕЗ перезагрузки страницы: app.js отдаёт window.tbMod.reload(),
  // а здесь подменяется адрес файлов данных. Если window.tbMod нет (app.js старый),
  // работает прежний способ: плавное затухание и перезагрузка.
  const MODS = [
    { id: 'terraria', name: 'Terraria', full: 'Terraria', color: '#7fc96b' },
    { id: 'calamity', name: 'Calamity', full: 'Calamity Mod', color: '#e0505f' },
    { id: 'fargo', name: "Fargo's", full: "Fargo's Mods", color: '#b48cff' }
  ];
  const modById = (id) => MODS.find(m => m.id === id) || MODS[0];
  const modFromUrl = () => modById(new URLSearchParams(location.search).get('mod'));
  let cur = modFromUrl();
  const body = document.body;
  body.dataset.mod = cur.id;

  // Подмена адресов данных всегда включена и смотрит на текущий мод в момент запроса
  const RE = /(^|\/)(builds|items)\.json(?=\?|$)/;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (cur.id === 'terraria' || typeof input !== 'string' || !RE.test(input)) return orig(input, init);
    const url = input.replace(RE, (m, p, f) => p + 'mods/' + cur.id + '-' + f + '.json');
    if (init && init.method === 'PUT' && typeof init.body === 'string') {
      try {
        const b = JSON.parse(init.body);
        if (typeof b.message === 'string') {
          b.message += ' [' + cur.full + ']';
          init = Object.assign({}, init, { body: JSON.stringify(b) });
        }
      } catch (e) { /* отправляем как есть */ }
    }
    return orig(url, init);
  };
  const robots = document.querySelector('meta[name="robots"]');
  const ROBOTS_ORIG = robots ? robots.getAttribute('content') : null;
  const applyRobots = () => {
    if (robots) robots.setAttribute('content', cur.id === 'terraria' ? ROBOTS_ORIG : 'noindex, follow');
  };
  applyRobots();

  const css = document.createElement('style');
  css.textContent = `
/* ряд: шапка класса слева, панель мода справа */
.hero-row{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:var(--stage-gap);align-items:stretch}
.hero-row>.hero{min-width:0;grid-column:1;grid-row:1}
.hero-row>.mod-nav{grid-column:2;grid-row:1}

/* панель выбора мода (большая, в стиле шапки класса) */
.mod-nav{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:var(--hero-pad);background:linear-gradient(135deg,var(--panel-2),var(--panel));border:var(--bw) solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);position:relative;overflow:hidden}
.mod-label{margin:0 0 2px;color:var(--cls);font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.mod-btn{display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;border:var(--bw) solid var(--line);background:var(--panel);color:var(--text);border-radius:var(--radius-sm);cursor:pointer;font-size:15px;font-weight:600;text-align:left}
.mod-btn:hover{border-color:var(--mc)}
.mod-btn[aria-pressed="true"]{background:var(--mc);color:#1a1310;border-color:var(--mc)}
.mod-dot{width:10px;height:10px;background:var(--mc);flex:0 0 10px}
.mod-btn[aria-pressed="true"] .mod-dot{background:#1a1310}

/* пиксельный стиль: та же рамка, что у шапки класса */
body.px .mod-nav{border-radius:0;border-width:max(var(--bw),2px);box-shadow:0 0 0 2px var(--px-edge),inset 0 0 0 2px var(--px-edge),var(--px-shadow)}
body.px .mod-label{font-family:var(--font-body);font-weight:700}
body.px .mod-btn{--pxc:var(--px-edge);border:0;border-radius:0;margin:2px;width:calc(100% - 4px);background:var(--cell);font-family:var(--font-body);box-shadow:0 -2px 0 0 var(--pxc),0 2px 0 0 var(--pxc),-2px 0 0 0 var(--pxc),2px 0 0 0 var(--pxc),inset 2px 2px 0 0 rgba(255,255,255,.08),inset -2px -2px 0 0 rgba(0,0,0,.4);transition:transform .12s steps(2)}
body.px .mod-btn:hover{--pxc:var(--mc);transform:translateY(-2px)}
body.px .mod-btn[aria-pressed="true"]{background:var(--mc);--pxc:var(--px-edge);transform:none;box-shadow:0 -2px 0 0 var(--pxc),0 2px 0 0 var(--pxc),-2px 0 0 0 var(--pxc),2px 0 0 0 var(--pxc),inset 2px 2px 0 0 rgba(255,255,255,.35),inset -2px -2px 0 0 rgba(0,0,0,.3)}

/* плавная смена мода: содержимое гаснет, меняются данные, содержимое плавно появляется */
#app{transition:opacity .24s ease,transform .24s ease}
body.mod-leaving #app,body.mod-loading #app{opacity:0;transform:translateY(6px)}
@media (prefers-reduced-motion:reduce){#app{transition:none}body.mod-leaving #app,body.mod-loading #app{transform:none}}

body[data-mod="calamity"] .eyebrow::after{content:" · Calamity Mod"}
body[data-mod="fargo"] .eyebrow::after{content:" · Fargo's Mods"}
body:not([data-mod="terraria"]) #app>.hero-row:last-child .legend::after{content:"Для этого мода билдов пока нет.";flex:0 0 100%;color:var(--text)}
body.editing:not([data-mod="terraria"]) #app>.hero-row:last-child .legend::after{content:"Билдов пока нет. Добавь этапы: ⚙ → «Этапы подготовки»."}

/* узкие экраны: панель мода под шапкой класса, кнопки в ряд */
@media (max-width:760px){
  .hero-row{grid-template-columns:1fr}
  .hero-row>.hero,.hero-row>.mod-nav{grid-column:1;grid-row:auto}
  .mod-nav{flex-direction:row;flex-wrap:wrap;align-items:center;padding:16px}
  .mod-label{flex:0 0 100%}
  .mod-btn{flex:1 1 auto;width:auto;justify-content:center}
  body.px .mod-btn{width:auto}
}
`;
  document.head.append(css);

  const nav = document.createElement('nav');
  nav.className = 'mod-nav';
  nav.id = 'mod-nav';
  nav.setAttribute('aria-label', 'Мод');
  const label = document.createElement('span');
  label.className = 'mod-label';
  label.textContent = 'Мод';
  nav.append(label);

  const buttons = {};
  const setPressed = () => MODS.forEach(m => buttons[m.id].setAttribute('aria-pressed', m.id === cur.id ? 'true' : 'false'));
  const urlFor = (mod) => {
    const u = new URL(location.href);
    if (mod.id === 'terraria') u.searchParams.delete('mod'); else u.searchParams.set('mod', mod.id);
    return u.toString();
  };
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let switching = false;

  async function switchMod(id, push) {
    const next = modById(id);
    if (next.id === cur.id || switching) return;
    const api = window.tbMod;

    // у app.js нет нужного входа: прежний способ, затухание и перезагрузка
    if (!api || typeof api.reload !== 'function') {
      switching = true;
      body.classList.add('mod-leaving');
      await wait(reduceMotion() ? 0 : 260);
      if (push) location.href = urlFor(next); else location.reload();
      return;
    }

    // несохранённые правки владельца при смене мода пропали бы
    if (typeof api.dirty === 'function' && api.dirty() &&
        !window.confirm('Есть несохранённые изменения. Переключить мод без сохранения? Они пропадут.')) {
      if (!push) history.pushState(null, '', urlFor(cur));   // вернуть адрес после «Назад/Вперёд»
      return;
    }

    switching = true;
    const prev = cur;
    body.classList.add('mod-leaving');
    cur = next;   // с этого момента fetch берёт файлы нового мода
    try {
      await Promise.all([api.reload(), wait(reduceMotion() ? 0 : 240)]);
      body.dataset.mod = cur.id;
      applyRobots();
      setPressed();
      if (push) history.pushState(null, '', urlFor(next));
    } catch (e) {
      console.warn('Не удалось загрузить мод', next.id, e);
      cur = prev;   // данные на экране остались от прежнего мода
      setPressed();
      if (!push) history.replaceState(null, '', urlFor(prev));
      window.alert('Не удалось загрузить данные мода «' + next.full + '». Остаёмся на «' + prev.full + '».');
    } finally {
      switching = false;
      requestAnimationFrame(() => body.classList.remove('mod-leaving'));
    }
  }

  MODS.forEach(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mod-btn';
    b.title = m.full;
    b.style.setProperty('--mc', m.color);
    b.setAttribute('aria-pressed', m.id === cur.id ? 'true' : 'false');
    const dot = document.createElement('span');
    dot.className = 'mod-dot';
    b.append(dot, m.name);
    b.addEventListener('click', () => switchMod(m.id, true));
    buttons[m.id] = b;
    nav.append(b);
  });
  // кнопки «Назад/Вперёд» в браузере тоже переключают мод без перезагрузки
  window.addEventListener('popstate', () => switchMod(modFromUrl().id, false));
  window.addEventListener('pageshow', (e) => { if (e.persisted) body.classList.remove('mod-leaving', 'mod-loading'); });

  // app.js при каждой перерисовке заменяет содержимое #app (шапка класса + этапы).
  // Следим за этим и каждый раз ставим шапку класса и панель мода в один ряд.
  const app = document.getElementById('app');
  function place() {
    if (!app) return;
    const hero = app.querySelector(':scope > .hero');
    if (!hero) return;
    const row = document.createElement('div');
    row.className = 'hero-row';
    app.insertBefore(row, hero);
    row.append(hero, nav);
  }
  // пока app.js не нарисовал страницу, содержимое скрыто и потом плавно появляется
  body.classList.add('mod-loading');
  const reveal = () => {
    if (app && app.querySelector('.seo-fallback')) return;   // ещё стоит заглушка до загрузки данных
    requestAnimationFrame(() => body.classList.remove('mod-loading'));
  };
  setTimeout(() => body.classList.remove('mod-loading'), 5000);   // страховка, если данные не загрузились
  if (app) {
    new MutationObserver(() => { place(); reveal(); }).observe(app, { childList: true });
    place();
  }
})();
