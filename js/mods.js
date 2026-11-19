(() => {
  'use strict';
  // Выбор мода: Terraria (по умолчанию), Calamity, Fargo's.
  // У каждого мода свои данные: data/mods/<мод>-builds.json и data/mods/<мод>-items.json.
  // Редактор владельца работает как обычно, но читает и сохраняет файлы выбранного мода.
  const MODS = [
    { id: 'terraria', name: 'Terraria', full: 'Terraria', color: '#7fc96b' },
    { id: 'calamity', name: 'Calamity', full: 'Calamity Mod', color: '#e0505f' },
    { id: 'fargo', name: "Fargo's", full: "Fargo's Mods", color: '#b48cff' }
  ];
  const wanted = new URLSearchParams(location.search).get('mod');
  const cur = MODS.find(m => m.id === wanted) || MODS[0];
  document.body.dataset.mod = cur.id;

  if (cur.id !== 'terraria') {
    const RE = /(^|\/)(builds|items)\.json(?=\?|$)/;
    const orig = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (typeof input !== 'string' || !RE.test(input)) return orig(input, init);
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
    if (robots) robots.setAttribute('content', 'noindex, follow');
  }

  const css = document.createElement('style');
  css.textContent = `
.mod-nav{display:flex;align-items:center;gap:4px;padding:3px 4px 3px 10px;background:var(--panel-2);border:var(--bw) solid var(--line);border-radius:var(--radius-sm)}
.mod-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-right:2px}
.mod-btn{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:var(--bw) solid transparent;background:transparent;color:var(--text);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-weight:600}
.mod-btn:hover{border-color:var(--mc)}
.mod-btn[aria-pressed="true"]{background:var(--mc);color:#1a1310;border-color:var(--mc)}
.mod-dot{width:8px;height:8px;background:var(--mc);flex:0 0 8px}
.mod-btn[aria-pressed="true"] .mod-dot{background:#1a1310}
body.px .mod-nav{--pxc:var(--px-edge);border:0;border-radius:0;margin:2px;background:var(--cell-deep);box-shadow:0 -2px 0 0 var(--pxc),0 2px 0 0 var(--pxc),-2px 0 0 0 var(--pxc),2px 0 0 0 var(--pxc),inset 2px 2px 0 0 rgba(0,0,0,.45),inset -2px -2px 0 0 rgba(255,255,255,.06)}
body.px .mod-btn{--pxc:var(--px-edge);border:0;border-radius:0;margin:2px;background:var(--cell);font-family:var(--font-body);box-shadow:0 -2px 0 0 var(--pxc),0 2px 0 0 var(--pxc),-2px 0 0 0 var(--pxc),2px 0 0 0 var(--pxc),inset 2px 2px 0 0 rgba(255,255,255,.08),inset -2px -2px 0 0 rgba(0,0,0,.4);transition:transform .12s steps(2)}
body.px .mod-btn:hover{--pxc:var(--mc);transform:translateY(-2px)}
body.px .mod-btn[aria-pressed="true"]{background:var(--mc);--pxc:var(--px-edge);transform:none;box-shadow:0 -2px 0 0 var(--pxc),0 2px 0 0 var(--pxc),-2px 0 0 0 var(--pxc),2px 0 0 0 var(--pxc),inset 2px 2px 0 0 rgba(255,255,255,.35),inset -2px -2px 0 0 rgba(0,0,0,.3)}
body[data-mod="calamity"] .eyebrow::after{content:" · Calamity Mod"}
body[data-mod="fargo"] .eyebrow::after{content:" · Fargo's Mods"}
body:not([data-mod="terraria"]) #app>.hero:last-child .legend::after{content:"Для этого мода билдов пока нет.";flex:0 0 100%;color:var(--text)}
body.editing:not([data-mod="terraria"]) #app>.hero:last-child .legend::after{content:"Билдов пока нет. Добавь этапы: ⚙ → «Этапы подготовки»."}
@media (max-width:640px){.mod-nav{width:100%}.mod-btn{flex:1 1 auto;justify-content:center}}
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
    b.addEventListener('click', () => {
      if (m.id === cur.id) return;
      const u = new URL(location.href);
      if (m.id === 'terraria') u.searchParams.delete('mod'); else u.searchParams.set('mod', m.id);
      location.href = u.toString();   // смена мода = загрузка его данных
    });
    nav.append(b);
  });
  const bar = document.querySelector('.topbar-inner');
  if (bar) bar.insertBefore(nav, document.getElementById('edit-badge'));
})();
