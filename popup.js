const PRESETS = {
  dim:      "#15202b",
  midnight: "#0d1117",
  nordic:   "#2E3440",
  forest:   "#1A1C19",
  dracula:  "#282A36",
  coffee:   "#1B1817",
  space:    "#1E1E1E",
};

const DEFAULTS = { enabled: true, color: "#15202b", preset: "dim" };

const $  = id => document.getElementById(id);
const toggle      = $("toggleEnabled");
const content     = $("content");
const pickerSection = $("colorPickerSection");
const canvas      = $("colorCanvas");
const cursor      = $("canvasCursor");
const hueSlider   = $("hueSlider");
const hexInput    = $("hexInput");
const colorPreview = $("colorPreview");
const activeLabel = $("activeColorLabel");
const customDot   = $("customDot");
const swatches    = document.querySelectorAll(".swatch");

let state = { ...DEFAULTS };

// ── Color math ─────────────────────────────────────────────────────

function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return '#' + [f(5), f(3), f(1)]
    .map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function hexToHsv(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { h: 210, s: 0.4, v: 0.17 };
  let r = parseInt(m[1],16)/255, g = parseInt(m[2],16)/255, b = parseInt(m[3],16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d) {
    h = max === r ? ((g-b)/d*60 + (g<b?360:0))
      : max === g ? ((b-r)/d*60 + 120)
      :             ((r-g)/d*60 + 240);
  }
  return { h: Math.round(h), s: max ? d/max : 0, v: max };
}

function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

// ── Canvas picker ──────────────────────────────────────────────────

let currentHue = 210;
let cursorX = 0.4, cursorY = 0.83; // normalized 0-1 (s, 1-v)

function drawCanvas() {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  // Saturation gradient (left=white, right=full hue)
  const satGrad = ctx.createLinearGradient(0, 0, w, 0);
  satGrad.addColorStop(0, '#fff');
  satGrad.addColorStop(1, `hsl(${currentHue}, 100%, 50%)`);
  ctx.fillStyle = satGrad;
  ctx.fillRect(0, 0, w, h);

  // Value gradient (top=transparent, bottom=black)
  const valGrad = ctx.createLinearGradient(0, 0, 0, h);
  valGrad.addColorStop(0, 'rgba(0,0,0,0)');
  valGrad.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = valGrad;
  ctx.fillRect(0, 0, w, h);
}

function updateCursorPos() {
  const w = canvas.offsetWidth || canvas.width;
  const h = canvas.offsetHeight || canvas.height;
  cursor.style.left = (cursorX * w) + 'px';
  cursor.style.top  = (cursorY * h) + 'px';
}

function pickFromCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
  cursorX = x; cursorY = y;
  updateCursorPos();
  const hex = hsvToHex(currentHue, x, 1 - y);
  applyCustomColor(hex);
}

canvas.addEventListener('mousedown', e => {
  pickFromCanvas(e);
  const move = ev => pickFromCanvas(ev);
  const up   = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
});

hueSlider.addEventListener('input', () => {
  currentHue = +hueSlider.value;
  drawCanvas();
  const hex = hsvToHex(currentHue, cursorX, 1 - cursorY);
  applyCustomColor(hex);
});

hexInput.addEventListener('input', () => {
  let v = hexInput.value.trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (!isValidHex(v)) return;
  const { h, s, v: bv } = hexToHsv(v);
  currentHue = h; cursorX = s; cursorY = 1 - bv;
  hueSlider.value = h;
  drawCanvas();
  updateCursorPos();
  applyCustomColor(v, false);
});
hexInput.addEventListener('keydown', e => { if (e.key === 'Enter') hexInput.blur(); });

function applyCustomColor(hex, syncHex = true) {
  state.color  = hex;
  state.preset = 'custom';
  colorPreview.style.background = hex;
  activeLabel.textContent = hex;
  if (syncHex) hexInput.value = hex;
  customDot.style.background = hex;
  customDot.style.border = '2px solid rgba(255,255,255,.2)';
  customDot.innerHTML = '';
  save();
}

// ── UI render ──────────────────────────────────────────────────────

function renderUI() {
  toggle.checked = state.enabled;
  content.classList.toggle('off', !state.enabled);
  activeLabel.textContent = state.color;

  swatches.forEach(b => b.classList.toggle('active', b.dataset.preset === state.preset));

  const isCustom = state.preset === 'custom';
  pickerSection.classList.toggle('hidden', !isCustom);

  if (isCustom) {
    const { h, s, v } = hexToHsv(state.color);
    currentHue = h; cursorX = s; cursorY = 1 - v;
    hueSlider.value = h;
    colorPreview.style.background = state.color;
    hexInput.value = state.color;
    customDot.style.background = state.color;
    customDot.style.border = '2px solid rgba(255,255,255,.2)';
    customDot.innerHTML = '';
    drawCanvas();
    updateCursorPos();
  } else {
    customDot.style.background = '';
    customDot.style.border = '';
    customDot.innerHTML = `<svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  }
}

function save() {
  chrome.storage.sync.set(state);
  chrome.runtime.sendMessage({ type: 'STATE_UPDATED' }).catch(() => {});
}

// ── Events ─────────────────────────────────────────────────────────

toggle.addEventListener('change', () => {
  state.enabled = toggle.checked;
  renderUI(); save();
});

swatches.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.preset;
    state.preset = id;
    if (id !== 'custom') state.color = PRESETS[id];
    renderUI(); save();
  });
});

// ── Init ───────────────────────────────────────────────────────────

chrome.storage.sync.get(DEFAULTS, stored => {
  state = { ...DEFAULTS, ...stored };
  renderUI();
});
