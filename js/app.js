(() => {
  'use strict';

  const CLASSES = {
    melee:    { name: 'Воин',        color: '#e0664a', blurb: 'Ближний бой: мечи, копья, кастеты и броня ближнего боя.' },
    magic:    { name: 'Маг',         color: '#5fa8e8', blurb: 'Магия: посохи, книги и зелья маны.' },
    summoner: { name: 'Призыватель', color: '#a98be8', blurb: 'Миньоны, хлысты и посохи призыва.' },
    ranged:   { name: 'Стрелок',     color: '#7fc96b', blurb: 'Дальний бой: луки, ружья, пушки и патроны.' }
  };
  const ORDER = ['melee', 'magic', 'summoner', 'ranged'];
  const CATS = [
    { id: 'armor', name: 'Броня' },
    { id: 'weapons', name: 'Оружие' },
    { id: 'accessories', name: 'Аксессуары' },
    { id: 'buffs', name: 'Баффы' }
  ];
  const BOSS_NAMES = {
    ks: 'Король слаймов', eye: 'Глаз Ктулху', eow: 'Пожиратель миров', boc: 'Мозг Ктулху',
    'queen-bee': 'Королева пчёл', skeletron: 'Скелетрон', wof: 'Стена плоти',
    'queen-slime': 'Королева слизней', destroyer: 'Уничтожитель', twins: 'Близнецы',
    'skeletron-prime': 'Скелетрон Прайм', plantera: 'Плантера', duke: 'Герцог Рыброн',
    golem: 'Голем', empress: 'Императрица света', lunatic: 'Культист Лунатик', 'moon-lord': 'Лунный Лорд'
  };
  const STATUS_TEXT = { ok: 'Данные проверены', partial: 'Проверено частично', none: 'Данных по вики нет' };
  const WIKI = 'https://terraria.wiki.gg/wiki/';
  const CFG_KEY = 'tb.editor.v1';

  let DATA = null;          // { classes, builds }
  let ITEMS = {};           // name -> item record
  let DIRTY = false;        // unsaved edits
  let CFG = loadCfg();      // { token, repo, branch, dir, login }
  let EDIT = !!(CFG.token && CFG.repo);
  const tabState = {};      // stage key -> active category

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
    toast._t = setTimeout(() => { t.hidden = true; }, 3200);
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

  function itemButton(name, note, onRemove) {
    const d = itemData(name);
    const btn = el('button', { class: 'item-btn', type: 'button', 'data-item': name, onclick: () => openItem(name) }, [
      el('span', { class: 'img-slot', 'aria-hidden': 'true' }),
      el('span', {}, [
        el('span', { class: 'item-name' }, [name]),
        note ? el('span', { class: 'item-note', text: note }) : null
      ]),
      el('span', { class: `status-dot ${d.status}`, title: STATUS_TEXT[d.status] || '' })
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
        itemButton(a.name, cleanNote(a.note), EDIT ? () => removeAlt(stage, cat, ei, ai) : null)
      ]))
    ]));
    if (!entries.length) cards.push(el('p', { class: 'empty', text: 'Для этой категории пока нет предметов.' }));
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
    }, [c.name, el('span', { class: 'count', text: String((stage.cats[c.id] || []).length) })])));
    const panel = el('div', { class: 'build-panel', role: 'tabpanel', id: `panel-${key}` }, [
      el('p', { class: 'build-panel-title', text: `${CATS.find(c => c.id === active).name}: нажми на предмет, чтобы увидеть рецепт и дроп.` }),
      renderCategory(stage, active)
    ]);
    const head = el('div', { class: 'stage-head' }, [
      el('div', { class: 'stage-num', text: String(index + 1) }),
      el('div', {}, [
        el('h2', { class: 'stage-title', text: stage.title }),
        el('div', { class: 'boss-chips' }, stage.bosses.map(b => el('span', { class: 'boss-chip', text: BOSS_NAMES[b] || b })))
      ])
    ]);
    return el('section', { class: 'stage', id: `stage-${index + 1}` }, [head, tabs, panel]);
  }

  function renderClass(key) {
    const c = CLASSES[key];
    const stages = DATA.builds[key] || [];
    const hero = el('section', { class: 'hero', style: `--cls:${c.color}` }, [
      el('p', { class: 'eyebrow', text: 'Класс' }),
      el('h1', { text: c.name }),
      el('p', { text: c.blurb }),
      el('div', { class: 'legend' }, [
        el('span', {}, [el('span', { class: 'status-dot ok' }), 'данные проверены']),
        el('span', {}, [el('span', { class: 'status-dot partial' }), 'частично']),
        el('span', {}, [el('span', { class: 'status-dot' }), 'нет данных'])
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
  function addEntry(stage, cat, name, note) {
    ensureItem(name);
    stage.cats[cat].push([{ name, note }]);
    markDirty();
    renderAll();
    toast(`«${name}» добавлен`);
  }

  // ---------- item view modal ----------
  function openItem(name) {
    if (EDIT) { openItemEditor(name); return; }
    const d = itemData(name);
    const c = CLASSES[currentClass()];
    const sec = (title, children) => el('section', { class: 'modal-section' }, [el('h3', { text: title }), ...children]);
    const renderRecipe = (r) => el('div', { class: 'recipe' }, [
      el('div', { class: 'recipe-station', text: `Станция: ${r.station || 'нет'}` }),
      el('div', { class: 'ingredients' }, r.ingredients.map(i => el('a', {
        class: 'ingredient', href: wikiUrl(i.en), target: '_blank', rel: 'noopener noreferrer',
        title: 'Открыть страницу предмета на вики'
      }, [i.en, el('b', { text: `×${i.count}` })])))
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
      body.push(sec('Дроп', [el('ul', { class: 'drop-list' }, d.drops.map(x => el('li', {}, [x.source, x.chance ? ` — ${x.chance}` : '']))) ]));
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
          el('div', { class: 'sub' }, [d.en ? `${d.en} · ` : '', el('span', { class: `badge ${d.status}`, text: STATUS_TEXT[d.status] || '' })])
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
            field('Станция', r.station, v => { r.station = v; }, { ph: 'Workbench / Anvil / нет' }),
            el('button', { class: 'ed-btn danger', type: 'button', text: 'Удалить рецепт', onclick: () => { recipes.splice(ri, 1); render(); } })
          ]),
          el('div', { class: 'ed-label', text: 'Ингредиенты (английское название, как на вики)' }),
          ...r.ingredients.map((ing, ii) => el('div', { class: 'ed-row' }, [
            field('Название', ing.en, v => { ing.en = v; }, { ph: 'Название' }),
            field('Кол-во', ing.count, v => { ing.count = v; }, { type: 'number' }),
            el('button', { class: 'ed-btn danger small', type: 'button', text: '×', 'aria-label': 'Удалить ингредиент', onclick: () => { r.ingredients.splice(ii, 1); render(); } })
          ])),
          el('button', { class: 'ed-btn', type: 'button', text: '+ ингредиент', onclick: () => { r.ingredients.push({ en: '', count: 1 }); render(); } })
        ])),
        el('button', { class: 'ed-btn primary', type: 'button', text: '+ рецепт', onclick: () => { recipes.push({ station: '', ingredients: [] }); render(); } })
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
          field('Источник', d.source, v => { d.source = v; }, { ph: 'Враг или босс' }),
          field('Шанс', d.chance, v => { d.chance = v; }, { ph: '25%' }),
          el('button', { class: 'ed-btn danger small', type: 'button', text: '×', 'aria-label': 'Удалить дроп', onclick: () => { drops.splice(di, 1); render(); } })
        ])),
        el('button', { class: 'ed-btn primary', type: 'button', text: '+ дроп', onclick: () => { drops.push({ source: '', chance: '' }); render(); } })
      );
    };
    render();
    return box;
  }

  function openItemEditor(name) {
    const draft = JSON.parse(JSON.stringify(itemData(name)));
    const isSet = !!(draft.pieces && draft.pieces.length);
    const c = CLASSES[currentClass()];
    const statusSel = el('select', { class: 'ed-input' }, Object.entries(STATUS_TEXT).map(([v, t]) =>
      el('option', { value: v, selected: v === draft.status ? true : null, text: t })));
    statusSel.value = draft.status;
    statusSel.addEventListener('change', () => { draft.status = statusSel.value; });

    const body = el('div', { class: 'modal-body' }, [
      el('div', { class: 'ed-grid' }, [
        field('Английское название (вики)', draft.en, v => { draft.en = v; }, { ph: 'Shroomite Bar' }),
        field('Ссылка на вики (необязательно)', draft.wiki, v => { draft.wiki = v; }, { ph: 'https://terraria.wiki.gg/wiki/…' }),
        el('label', { class: 'ed-field' }, [el('span', { class: 'ed-label', text: 'Статус данных' }), statusSel])
      ]),
      field('Описание', draft.description, v => { draft.description = v; }, { multiline: true, ph: 'Краткое описание предмета' }),
      field('Получение (если не крафтится и не падает)', draft.obtain, v => { draft.obtain = v; }, { ph: 'Покупается у Торговца…' }),
      el('section', { class: 'modal-section' }, [
        el('h3', { text: isSet ? 'Рецепт по частям' : 'Рецепт' }),
        isSet ? piecesEditor(draft.pieces) : recipesEditor(draft.recipes)
      ]),
      el('section', { class: 'modal-section' }, [el('h3', { text: 'Дроп' }), dropsEditor(draft.drops)]),
      el('div', { class: 'ed-actions' }, [
        el('button', { class: 'ed-btn', type: 'button', text: 'Отмена', onclick: closeModal }),
        el('button', { class: 'ed-btn primary', type: 'button', text: 'Применить', onclick: () => {
          if (draft.wiki === '' && draft.en) draft.wiki = wikiUrl(draft.en);
          draft.hasDrop = draft.drops.length > 0;
          ITEMS[name] = draft;
          markDirty();
          closeModal();
          renderAll();
          toast('Изменения применены. Не забудь сохранить на GitHub.');
        } })
      ])
    ]);
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
  function closeModal() {
    const root = $('#modal-root');
    root.hidden = true;
    root.replaceChildren();
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
        CFG = { token: t, repo: r, branch: branch.value.trim() || 'main', dir: dir.value.trim().replace(/^\/+|\/+$/g, '') || 'data', login: login.value.trim() || user.login };
        saveCfg();
        EDIT = true;
        closeModal();
        renderAll();
        toast(`Режим редактирования включён (${user.login})`);
      } catch (e) {
        msg.textContent = `Не получилось: ${e.message}`;
      }
    };
    const disable = () => {
      CFG = {};
      saveCfg();
      EDIT = false;
      DIRTY = false;
      closeModal();
      renderAll();
      toast('Режим редактирования выключен');
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
          CFG.token ? el('button', { class: 'ed-btn danger', type: 'button', text: 'Выключить редактирование', onclick: disable }) : null,
          el('button', { class: 'ed-btn primary', type: 'button', text: EDIT ? 'Обновить настройки' : 'Включить редактирование', onclick: enable })
        ])
      ])
    ]));
  }

  function renderSaveBar() {
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

  async function putFile(path, obj, message) {
    const url = `https://api.github.com/repos/${CFG.repo}/contents/${path}`;
    const headers = { Authorization: `Bearer ${CFG.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
    const get = await fetch(`${url}?ref=${encodeURIComponent(CFG.branch)}`, { headers });
    if (!get.ok) throw new Error(`чтение ${path}: ${get.status}`);
    const meta = await get.json();
    const put = await fetch(url, {
      method: 'PUT', headers,
      body: JSON.stringify({ message, content: b64(JSON.stringify(obj, null, 1) + '\n'), sha: meta.sha, branch: CFG.branch })
    });
    if (!put.ok) throw new Error(`запись ${path}: ${put.status}`);
  }

  async function saveAll() {
    if (!EDIT) return;
    toast('Сохраняю…');
    try {
      await putFile(`${CFG.dir}/builds.json`, DATA, 'Обновление билдов (редактор сайта)');
      await putFile(`${CFG.dir}/items.json`, ITEMS, 'Обновление предметов (редактор сайта)');
      DIRTY = false;
      renderSaveBar();
      toast('Сохранено на GitHub. Сайт обновится через минуту.');
    } catch (e) {
      toast(`Ошибка сохранения: ${e.message}`);
    }
  }

  // ---------- wiring ----------
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', renderAll);
  window.addEventListener('beforeunload', (e) => { if (DIRTY) { e.preventDefault(); e.returnValue = ''; } });
  $('#settings-btn').addEventListener('click', openSettings);

  Promise.all([
    fetch('data/builds.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json())
  ]).then(([builds, items]) => {
    DATA = builds;
    ITEMS = items;
    renderAll();
  }).catch(err => {
    $('#app').replaceChildren(el('p', { class: 'empty', text: 'Не удалось загрузить данные. Открой сайт через локальный сервер или GitHub Pages.' }));
    console.error(err);
  });
})();
