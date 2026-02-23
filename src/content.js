const STYLE_ID  = "dfx-styles";
const ACTIVE    = "dfx-active";
const SCAN_CLS  = "dfx-dim";
const SCAN_ELEV = "dfx-dim-elev";

function hexToHueSat(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { h: 210, s: 34 };
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0, l = (max + min) / 2;
  if (d) {
    s = d / (l > 0.5 ? 2 - max - min : max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g ? ((b - r) / d + 2) / 6
      :             ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100) };
}

function buildPalette(h, s) {
  const bs = Math.round(s * 0.47);
  return {
    bg:        `hsl(${h},${s}%,13%)`,
    hover:     `hsl(${h},${Math.round(s*.74)}%,16%)`,
    elevated:  `hsl(${h},${Math.round(s*.71)}%,20%)`,
    backdrop:  `hsla(${h},${s}%,13%,.85)`,
    text:      `hsl(${h},${Math.round(s*.32)}%,60%)`,
    border:    `hsl(${h},${bs}%,26%)`,
    bgRaw:     `${h} ${s}% 13%`,
    borderRaw: `${h} ${bs}% 26%`,
    mutedRaw:  `${h} ${bs}% 55%`,
    gray60:    `${h} ${bs}% 60%`,
    gray50:    `${h} ${bs}% 50%`,
  };
}

function buildCSS(p) {
  return `
html.${ACTIVE}{--dfx-bg:${p.bg};--dfx-hover:${p.hover};--dfx-elevated:${p.elevated};--dfx-backdrop:${p.backdrop};--dfx-text:${p.text};--dfx-border:${p.border}}
html.${ACTIVE} body.LightsOut{--border:${p.borderRaw};--input:${p.borderRaw}}
html.${ACTIVE}[data-theme="dark"],html.${ACTIVE} [data-theme="dark"]{--background:${p.bgRaw};--border:${p.borderRaw};--input:${p.borderRaw};--muted-foreground:${p.mutedRaw};--color-background:${p.bgRaw};--color-gray-0:${p.bgRaw};--color-gray-50:${p.borderRaw};--color-gray-100:${p.borderRaw};--color-gray-700:${p.gray60};--color-gray-800:${p.gray50}}
html.${ACTIVE},html.${ACTIVE} body{background-color:var(--dfx-bg)!important}
html.${ACTIVE} [role="dialog"],html.${ACTIVE} [role="dialog"]>div,html.${ACTIVE} [aria-modal="true"],html.${ACTIVE} [aria-modal="true"]>div{background-color:var(--dfx-bg)!important}
html.${ACTIVE} [style*="background-color: rgb(0, 0, 0)"],html.${ACTIVE} [style*="background-color: rgba(0, 0, 0, 1)"],html.${ACTIVE} [style*="background-color: #000000"],html.${ACTIVE} [style*="background-color: #000;"]{background-color:var(--dfx-bg)!important}
html.${ACTIVE} [style*="background-color: rgb(24, 24, 27)"]{background-color:var(--dfx-hover)!important}
html.${ACTIVE} .r-kemksi,html.${ACTIVE} .r-1867qdf,html.${ACTIVE} .r-yfoy6g,html.${ACTIVE} .r-14lw9ot{background-color:var(--dfx-bg)!important}
html.${ACTIVE} .r-1niwhzg:not(.r-sdzlij){background-color:var(--dfx-bg)!important}
html.${ACTIVE} .r-1niwhzg.r-sdzlij{background-color:transparent!important}
html.${ACTIVE} form[role="search"] input{background-color:transparent!important}
html.${ACTIVE} .r-5zmot{background-color:var(--dfx-backdrop)!important}
html.${ACTIVE} .r-1shrkeu{background-color:var(--dfx-border)!important}
html.${ACTIVE} .r-1hdo0pc{background-color:var(--dfx-hover)!important}
html.${ACTIVE} .r-g2wdr4{background-color:var(--dfx-hover)!important}
html.${ACTIVE} .r-g2wdr4 [role="link"]:hover{background-color:var(--dfx-elevated)!important}
html.${ACTIVE} .r-gu4em3,html.${ACTIVE} .r-1bnu78o{background-color:var(--dfx-border)!important}
html.${ACTIVE} .bg-gray-0{background-color:var(--dfx-bg)!important}
html.${ACTIVE} .border-gray-50,html.${ACTIVE} .border-gray-100{border-color:var(--dfx-border)!important}
html.${ACTIVE} .r-1bwzh9t{color:var(--dfx-text)!important}
html.${ACTIVE} .public-DraftEditorPlaceholder-inner,html.${ACTIVE} .public-DraftEditorPlaceholder-root{color:var(--dfx-text)!important}
html.${ACTIVE} [style*="color: rgb(113, 118, 123)"]{color:var(--dfx-text)!important}
html.${ACTIVE} ::placeholder{color:var(--dfx-text)!important}
html.${ACTIVE} .${SCAN_CLS}{background-color:var(--dfx-bg)!important}
html.${ACTIVE} .${SCAN_ELEV}{background-color:var(--dfx-hover)!important}
html.${ACTIVE} ::-webkit-scrollbar{width:6px}
html.${ACTIVE} ::-webkit-scrollbar-track{background:var(--dfx-bg)}
html.${ACTIVE} ::-webkit-scrollbar-thumb{background:var(--dfx-border);border-radius:3px}
html.${ACTIVE} ::-webkit-scrollbar-thumb:hover{background:var(--dfx-elevated)}`;
}

let _enabled = false;
let _color   = "#15202b";

function palette() {
  const { h, s } = hexToHueSat(_color);
  return buildPalette(h, s);
}

function syncStyles() {
  const css = buildCSS(palette());
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

syncStyles();

if (localStorage.getItem("__dfx") !== "0" &&
    (!window.matchMedia || window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add(ACTIVE);
}

let _frame = 0;
const _queue = new Set();

function scanNode(n) {
  if (!n || n.nodeType !== 1 || n.classList.contains(SCAN_CLS) || n.classList.contains(SCAN_ELEV)) return;
  const bg = n.style.backgroundColor;
  if (bg === "rgb(0, 0, 0)" || bg === "rgba(0, 0, 0, 1)") n.classList.add(SCAN_CLS);
  else if (bg === "rgb(24, 24, 27)") n.classList.add(SCAN_ELEV);
}

function scanTree(root) {
  scanNode(root);
  for (const el of root.querySelectorAll("div,main,aside,header,nav,section,article,footer,button")) scanNode(el);
}

function schedScan(nodes) {
  for (const n of nodes) { if (n?.nodeType === 1) _queue.add(n); }
  if (_queue.size && !_frame) _frame = requestAnimationFrame(() => {
    _frame = 0;
    if (!document.documentElement.classList.contains(ACTIVE)) { _queue.clear(); return; }
    const batch = [..._queue]; _queue.clear();
    for (const n of batch) scanTree(n);
  });
}

function rescan() { if (_enabled && document.body) schedScan([document.body]); }

function activate() {
  syncStyles();
  document.documentElement.classList.add(ACTIVE);
  if (document.body) schedScan([document.body]);
}

function deactivate() {
  document.documentElement.classList.remove(ACTIVE);
  if (_frame) { cancelAnimationFrame(_frame); _frame = 0; _queue.clear(); }
  document.querySelectorAll(`.${SCAN_CLS},.${SCAN_ELEV}`).forEach(el => {
    el.classList.remove(SCAN_CLS, SCAN_ELEV);
  });
}

let _bodyObs, _seenDark = false, _lightSuspend = false;

function checkTheme() {
  if (!_enabled || !document.body) return;
  const dark = document.body.classList.contains("LightsOut");
  const active = document.documentElement.classList.contains(ACTIVE);
  if (dark) {
    _lightSuspend = false;
    activate();
    if (!active) [500,1500,3000,5000].forEach(t => setTimeout(rescan, t));
  } else if (active && _seenDark) {
    _lightSuspend = true;
    deactivate();
  }
}

function watchBody() {
  if (_bodyObs || !document.body) return;
  if (document.body.classList.contains("LightsOut")) _seenDark = true;
  _bodyObs = new MutationObserver(() => {
    if (document.body.classList.contains("LightsOut")) _seenDark = true;
    checkTheme();
  });
  _bodyObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

let _mainObs;
function watchDOM() {
  if (_mainObs) return;
  _mainObs = new MutationObserver(mutations => {
    try {
      if (_enabled && !_lightSuspend && !document.documentElement.classList.contains(ACTIVE)) activate();
      if (_enabled && document.documentElement.classList.contains(ACTIVE)) {
        for (const m of mutations) { if (m.addedNodes.length) schedScan(m.addedNodes); }
      }
      if (_enabled && document.body && !_bodyObs) watchBody();
    } catch { _mainObs.disconnect(); }
  });
  _mainObs.observe(document.documentElement, { childList: true, subtree: true });
}

const DEFAULTS = { enabled: true, color: "#15202b", preset: "dim" };

chrome.storage.sync.get(DEFAULTS, ({ enabled, color }) => {
  _enabled = !!enabled;
  _color   = color || "#15202b";
  try { localStorage.setItem("__dfx", _enabled ? "1" : "0"); } catch {}
  syncStyles();
  if (_enabled) {
    const dark = !window.matchMedia || window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) { activate(); [500,1500,3000,5000].forEach(t => setTimeout(rescan, t)); }
  } else {
    deactivate();
  }
  watchDOM();
  if (_enabled && document.body) watchBody();
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type !== "APPLY_STATE") return;
  _enabled = !!msg.state.enabled;
  _color   = msg.state.color || "#15202b";
  try { localStorage.setItem("__dfx", _enabled ? "1" : "0"); } catch {}
  syncStyles();
  if (_enabled) { _lightSuspend = false; activate(); }
  else deactivate();
});
