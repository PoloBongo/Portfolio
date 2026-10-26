// Sons synthétisés avec Web Audio : aucun fichier audio, désactivés par défaut.
// L'activation vient d'un clic de l'utilisateur ; le choix est mémorisé dans localStorage.
const KEY = "sound";
const listeners = new Set();

let ctx = null;
let master = null;
let analyser = null;
let levels = null;
let echo = null;
let noiseBuffer = null;
let ambient = null;
let enabled = false;
let hoverEl = null;
let lastHover = 0;

try {
  enabled = localStorage.getItem(KEY) === "on";
} catch (e) {
  enabled = false;
}

const notify = () => listeners.forEach((fn) => fn());

export const isSoundOn = () => enabled;

// Niveau sonore courant, de 0 à 1 (graves et médiums), pour animer le nuage de points ; 0 si le son est coupé
export function getAudioLevel() {
  if (!enabled || !analyser) return 0;
  if (!levels) levels = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(levels);
  let sum = 0;
  const bins = Math.min(20, levels.length);
  for (let i = 0; i < bins; i += 1) sum += levels[i];
  return Math.min(1, (sum / bins / 255) * 3.5);
}

export function subscribeSound(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function context() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = 0.0001;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 24;
  comp.ratio.value = 5;
  master.connect(comp);
  comp.connect(ctx.destination);

  // Branche d'écoute : le niveau sonore anime le nuage de points
  analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.82;
  master.connect(analyser);

  // Écho léger pour donner de l'air aux notes
  echo = ctx.createDelay(1);
  echo.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  echo.connect(feedback);
  feedback.connect(echo);
  echo.connect(wet);
  wet.connect(master);

  return ctx;
}

// Note courte avec enveloppe : freq (Hz), glideTo = glissando optionnel, echoSend = part envoyée à l'écho
function tone({ freq = 880, type = "sine", dur = 0.1, gain = 0.05, attack = 0.004, glideTo, delay = 0, echoSend = 0 }) {
  const c = context();
  if (!c || !enabled) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  amp.connect(master);
  if (echoSend > 0) {
    const send = c.createGain();
    send.gain.value = echoSend;
    amp.connect(send);
    send.connect(echo);
  }
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Souffle de bruit filtré dont la fréquence glisse de from à to (transitions, ouvertures)
function sweep({ from = 300, to = 3000, dur = 0.6, gain = 0.05, q = 1.4, delay = 0 }) {
  const c = context();
  if (!c || !enabled) return;
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const amp = c.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// Gamme pentatonique : chaque clic sur le nuage de points joue une note
const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function playNote(index = 0) {
  if (!enabled) return;
  const freq = SCALE[((index % SCALE.length) + SCALE.length) % SCALE.length];
  tone({ freq, type: "triangle", dur: 0.7, gain: 0.05, echoSend: 0.45 });
  tone({ freq: freq * 2, type: "sine", dur: 0.35, gain: 0.014, echoSend: 0.3 });
}

const SOUNDS = {
  tick: () => tone({ freq: 2100, dur: 0.03, gain: 0.012 }),
  hover: () => tone({ freq: 1480, dur: 0.045, gain: 0.018 }),
  click: () => {
    tone({ freq: 620, glideTo: 940, dur: 0.09, gain: 0.04 });
    tone({ freq: 1240, dur: 0.06, gain: 0.015, delay: 0.02 });
  },
  open: () => {
    sweep({ from: 260, to: 2600, dur: 0.55, gain: 0.04 });
    tone({ freq: 392, dur: 0.18, gain: 0.04, echoSend: 0.3 });
    tone({ freq: 587, dur: 0.22, gain: 0.04, delay: 0.07, echoSend: 0.3 });
  },
  close: () => {
    sweep({ from: 2200, to: 240, dur: 0.45, gain: 0.035 });
    tone({ freq: 587, dur: 0.14, gain: 0.035 });
    tone({ freq: 392, dur: 0.18, gain: 0.035, delay: 0.06 });
  },
  whoosh: () => sweep({ from: 220, to: 4200, dur: 0.75, gain: 0.05, q: 0.9 }),
  reveal: () => sweep({ from: 3600, to: 260, dur: 0.7, gain: 0.04, q: 0.9 }),
  boot: () => {
    [220, 329.6, 440, 554.4, 659.3].forEach((freq, i) =>
      tone({ freq, type: "triangle", dur: 0.28, gain: 0.04, delay: i * 0.075, echoSend: 0.35 })
    );
  },
  ach: () => {
    tone({ freq: 659.3, dur: 0.5, gain: 0.05, echoSend: 0.5 });
    tone({ freq: 987.8, dur: 0.7, gain: 0.045, delay: 0.11, echoSend: 0.5 });
    tone({ freq: 1318.5, dur: 0.9, gain: 0.03, delay: 0.22, echoSend: 0.5 });
  },
  on: () => {
    tone({ freq: 440, dur: 0.14, gain: 0.04 });
    tone({ freq: 660, dur: 0.2, gain: 0.04, delay: 0.08, echoSend: 0.3 });
  },
  error: () => {
    tone({ freq: 220, glideTo: 110, type: "sawtooth", dur: 0.4, gain: 0.035 });
  },
};

export function play(name) {
  if (!enabled) return;
  const fn = SOUNDS[name];
  if (fn) fn();
}

const SHIMMER = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 659.3];

function startAmbient() {
  const c = context();
  if (!c || ambient) return;
  const out = c.createGain();
  out.gain.value = 0.0001;
  out.gain.setTargetAtTime(0.05, c.currentTime, 1.4);
  out.connect(master);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 5;
  filter.connect(out);

  const oscs = [55, 82.41, 110.3].map((freq, i) => {
    const osc = c.createOscillator();
    osc.type = i === 0 ? "sawtooth" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 7;
    const level = c.createGain();
    level.gain.value = [0.5, 0.4, 0.25][i];
    osc.connect(level);
    level.connect(filter);
    osc.start();
    return osc;
  });

  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const depth = c.createGain();
  depth.gain.value = 260;
  lfo.connect(depth);
  depth.connect(filter.frequency);
  lfo.start();

  const timer = setInterval(() => {
    if (!enabled) return;
    const freq = SHIMMER[Math.floor(Math.random() * SHIMMER.length)];
    tone({ freq, dur: 3.2, gain: 0.018, attack: 0.7, echoSend: 0.7 });
  }, 5200);

  ambient = { oscs, lfo, out, timer };
}

function stopAmbient() {
  if (!ambient || !ctx) return;
  const { oscs, lfo, out, timer } = ambient;
  ambient = null;
  clearInterval(timer);
  out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  setTimeout(() => {
    oscs.forEach((osc) => osc.stop());
    lfo.stop();
    out.disconnect();
  }, 1200);
}

// À appeler depuis un clic : active ou coupe tout le son
export function setSound(on) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch (e) {
    // stockage indisponible : le choix vaut pour la session
  }
  const c = context();
  if (c && master) {
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(on ? 0.9 : 0.0001, c.currentTime, 0.15);
  }
  if (on) {
    startAmbient();
    play("on");
  } else {
    stopAmbient();
  }
  notify();
}

// Préférence « activé » mémorisée : le navigateur exige un geste avant de lancer le son
export function initSound() {
  if (!enabled) return;
  const arm = () => {
    window.removeEventListener("pointerdown", arm);
    window.removeEventListener("keydown", arm);
    const c = context();
    if (c && master) {
      master.gain.setTargetAtTime(0.9, c.currentTime, 0.3);
      startAmbient();
    }
  };
  window.addEventListener("pointerdown", arm);
  window.addEventListener("keydown", arm);
}

// Petits sons d'interface : survol et clic sur les éléments interactifs
export function initUiSounds() {
  const SELECTOR = 'a, button, [role="button"], summary';

  document.addEventListener(
    "pointerover",
    (e) => {
      if (!enabled || !(e.target instanceof Element)) return;
      const el = e.target.closest(SELECTOR);
      if (!el || el === hoverEl) return;
      hoverEl = el;
      const now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      play("hover");
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerout",
    (e) => {
      if (hoverEl && !(e.relatedTarget instanceof Node && hoverEl.contains(e.relatedTarget))) hoverEl = null;
    },
    { passive: true }
  );

  document.addEventListener(
    "click",
    (e) => {
      if (!enabled || !(e.target instanceof Element)) return;
      const el = e.target.closest(SELECTOR);
      if (el && !el.hasAttribute("data-sound-skip")) play("click");
    },
    true
  );
}
