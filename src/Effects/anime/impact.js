// Image d'impact façon anime : pendant deux images l'écran passe en négatif noir et blanc (le vrai contenu de la page,
// inversé par backdrop-filter), avec des lignes de concentration blanches vers le point frappé ; puis la page
// revient avec des lignes noires qui « bouillonnent » (redessinées au hasard à chaque image, comme en animation à
// la main) et s'effacent, une onomatopée tamponnée (« ドン ! ») et une secousse. Le fond WebGL prend le relais
// (lignes de concentration qui s'éteignent, Effects/stage3d/inkfield.js) grâce à l'évènement « anime:impact ».

let layer = null;
let canvas = null;
let ctx = null;
let neg = null;
let sfx = null;
let raf = 0;
let timers = [];

const ensure = () => {
  if (layer) return;
  layer = document.createElement("div");
  layer.className = "ax-impact";
  layer.setAttribute("aria-hidden", "true");
  neg = document.createElement("div");
  neg.className = "ax-impact__neg";
  canvas = document.createElement("canvas");
  canvas.className = "ax-impact__rays";
  sfx = document.createElement("b");
  sfx.className = "ax-impact__sfx";
  layer.append(neg, canvas, sfx);
  document.body.appendChild(layer);
  ctx = canvas.getContext("2d");
};

// Lignes de concentration : des coins de l'écran vers (x, y) ; le centre reste vide
const drawRays = (x, y, color, count, inner) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  const far = Math.hypot(W, H);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.05;
    const w = 0.002 + Math.random() * 0.012;
    const r0 = inner * (0.75 + Math.random() * 0.6);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a - w) * far, y + Math.sin(a - w) * far);
    ctx.lineTo(x + Math.cos(a + w) * far, y + Math.sin(a + w) * far);
    ctx.closePath();
    ctx.fill();
  }
};

// La page tremble (le contenu seulement : secouer un ancêtre des éléments fixes ou épinglés les décrocherait)
const shake = (amount) => {
  const main = document.querySelector("main");
  if (!main || document.querySelector(".pin-spacer > [style*='fixed']")) return;
  main.animate(
    [
      { translate: "0 0" },
      { translate: `${amount}px ${-amount * 0.6}px` },
      { translate: `${-amount * 0.8}px ${amount * 0.5}px` },
      { translate: `${amount * 0.5}px ${amount * 0.3}px` },
      { translate: `${-amount * 0.25}px 0` },
      { translate: "0 0" },
    ],
    { duration: 260, easing: "linear" }
  );
};

export function impact({ x, y, text = "ドン", strength = 1, invert = true } = {}) {
  ensure();
  timers.forEach(clearTimeout);
  timers = [];
  cancelAnimationFrame(raf);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cx = x == null ? W / 2 : x;
  const cy = y == null ? H / 2 : y;
  const inner = Math.min(W, H) * 0.16;

  window.dispatchEvent(new CustomEvent("anime:impact", { detail: { x: cx, y: cy, strength } }));
  layer.classList.add("is-on");

  // 1. Négatif (deux images)
  if (invert) {
    neg.classList.add("is-on");
    drawRays(cx, cy, "#fff", 90, inner);
  }

  // 2. Retour à la page, lignes noires qui bouillonnent puis s'effacent
  const start = performance.now() + (invert ? 70 : 0);
  const life = 380 * Math.max(0.6, strength);
  const boil = (now) => {
    const k = (now - start) / life;
    if (k < 0) {
      raf = requestAnimationFrame(boil);
      return;
    }
    neg.classList.remove("is-on");
    if (k >= 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = "";
      return;
    }
    canvas.style.opacity = String(1 - k * k);
    drawRays(cx, cy, "#101014", Math.round(70 * strength), inner * (1 + k * 0.8));
    raf = requestAnimationFrame(boil);
  };
  raf = requestAnimationFrame(boil);

  // 3. L'onomatopée, tamponnée près du point frappé (sans sortir de l'écran)
  if (text) {
    sfx.textContent = text;
    const left = Math.min(W - 160, Math.max(160, cx + (cx < W / 2 ? 90 : -90)));
    const top = Math.min(H - 110, Math.max(110, cy - 70));
    sfx.style.left = `${left}px`;
    sfx.style.top = `${top}px`;
    sfx.style.setProperty("--r", `${(Math.random() * 10 - 14).toFixed(1)}deg`);
    sfx.style.setProperty("--s", String(0.7 + 0.3 * strength));
    sfx.classList.remove("is-on");
    // relance l'animation CSS
    void sfx.offsetWidth;
    sfx.classList.add("is-on");
  }

  shake(10 * strength);
  timers.push(
    setTimeout(() => {
      layer.classList.remove("is-on");
      sfx.classList.remove("is-on");
    }, 900)
  );
}
