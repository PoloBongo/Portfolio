import { gsap } from "./motion";

// Transitions signature des mondes (voir Worlds/transitions.js pour le genre de chaque monde).
//
// Principe : la page change dans une View Transition. Chaque genre échantillonne densément (une valeur par image)
// les styles de la nouvelle et de l'ancienne image (clip-path, masque, filtre, transformation : propriétés
// « discrètes » ou interpolables, peu importe, le pas est d'une image) et dessine son décor dans un canvas posé
// au-dessus (.vt-fx, nommé pour faire partie de la transition). Deux familles :
//   - révélation : la nouvelle page apparaît par un masque (iris, encre, trame, fil, scan, déchirure, pixels) ;
//   - couverture : un décor opaque ferme l'écran, la page change dessous, le décor s'ouvre (store, liquide).
//
// Pas de requestAnimationFrame dans le callback de la View Transition (rendu suspendu) : tout part après `ready`.

const ease = {
  expo: gsap.parseEase("expo.inOut"),
  expoOut: gsap.parseEase("expo.out"),
  p2: gsap.parseEase("power2.inOut"),
  p3: gsap.parseEase("power3.inOut"),
  out3: gsap.parseEase("power3.out"),
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const channels = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgba = (hex, alpha) => `rgba(${channels(hex).join(",")},${alpha})`;
const poly = (points) => `polygon(${points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;

// Aléa reproductible (une même transition ne change pas d'allure à chaque image)
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/* ---------------------------------------------------------------------------------------------------------------
   Genres. Chacun renvoie { duration, unlockAt, newAt(p), oldAt(p), draw(ctx, p), oldOnTop }.
   p va de 0 à 1 (temps linéaire) ; la courbe d'accélération est appliquée dans le genre.
   c = { W, H, x, y, R (distance du clic au coin le plus loin), colors, bubbles }
   --------------------------------------------------------------------------------------------------------------- */

// Cercle depuis le clic (par défaut)
function iris(c) {
  return {
    duration: 1050,
    unlockAt: 0.35,
    newAt: (p) => ({ clipPath: `circle(${(c.R * ease.expo(p)).toFixed(1)}px at ${c.x}px ${c.y}px)` }),
    draw(ctx, p) {
      const r = c.R * ease.expo(p);
      ctx.strokeStyle = rgba(c.colors[0], 1 - p);
      ctx.lineWidth = 2;
      ctx.shadowColor = c.colors[0];
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  };
}

// Encre : une tache organique qui s'épanouit depuis le clic, bords vivants, bulles en option
function ink(c) {
  const rnd = seeded(97 + Math.round(c.x + c.y));
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const M = 80;
  const radius = (p) => c.R * 1.45 * (0.03 + 0.97 * ease.p2(p));
  const outline = (p) => {
    const r0 = radius(p);
    const amp = 0.4 * Math.pow(1 - p, 1.15);
    const pts = [];
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2;
      const n =
        0.5 * Math.sin(3 * a + ph[0] + p * 3.2) +
        0.3 * Math.sin(5 * a + ph[1] - p * 4.1) +
        0.22 * Math.sin(9 * a + ph[2] + p * 5.3) +
        0.12 * Math.sin(15 * a + ph[3] - p * 7);
      const r = r0 * (1 + n * amp);
      pts.push([c.x + Math.cos(a) * r, c.y + Math.sin(a) * r]);
    }
    return pts;
  };
  const bubbles = Array.from({ length: c.bubbles ? 26 : 0 }, () => ({ a: rnd() * 6.28, d: 0.55 + rnd() * 0.5, r: 2 + rnd() * 7, s: 0.4 + rnd() }));
  return {
    duration: 1400,
    unlockAt: 0.34,
    newAt: (p) => ({ clipPath: poly(outline(p)) }),
    oldAt: (p) => ({ filter: `brightness(${(1 - 0.55 * ease.expoOut(p)).toFixed(3)}) saturate(${(1 - 0.4 * p).toFixed(3)})` }),
    draw(ctx, p) {
      const pts = outline(p);
      const path = () => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
      };
      ctx.lineJoin = "round";
      ctx.strokeStyle = rgba(c.colors[1], 0.85 * (1 - p));
      ctx.lineWidth = 7 * (1 - p) + 1;
      ctx.shadowColor = c.colors[1];
      ctx.shadowBlur = 26;
      path();
      ctx.stroke();
      ctx.strokeStyle = rgba(c.colors[0], 0.9 * (1 - p * 0.7));
      ctx.lineWidth = 2.5;
      ctx.shadowColor = c.colors[0];
      ctx.shadowBlur = 16;
      path();
      ctx.stroke();
      ctx.shadowBlur = 0;
      // des bulles se détachent du bord de la tache et montent
      const r0 = radius(p);
      bubbles.forEach((b) => {
        const rr = r0 * (0.55 + 0.5 * b.d);
        const bx = c.x + Math.cos(b.a) * rr;
        const by = c.y + Math.sin(b.a) * rr - p * 120 * b.s;
        ctx.strokeStyle = rgba("#e4fff4", 0.85 * (1 - p * 0.8));
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bx, by, b.r * (1 + 0.8 * p) + 2, 0, 7);
        ctx.stroke();
        ctx.fillStyle = rgba("#e4fff4", 0.14 * (1 - p));
        ctx.fill();
      });
    },
  };
}

// Trame de demi-teinte : des points qui grossissent et se rejoignent, de plus en plus loin du clic
function dots(c) {
  const tile = clamp(Math.round(c.W / 40), 26, 46);
  const rFull = tile * 0.74;
  return {
    duration: 1250,
    unlockAt: 0.36,
    newAt: (p) => {
      const R = c.R * 1.08 * ease.expo(p);
      const r = rFull * clamp(ease.p2(p) * 1.35);
      return {
        maskImage: `radial-gradient(circle at center, #000 ${r.toFixed(2)}px, transparent ${(r + 0.8).toFixed(2)}px), radial-gradient(circle at ${c.x}px ${c.y}px, #000 ${R.toFixed(1)}px, transparent ${(R + 2).toFixed(1)}px)`,
        maskSize: `${tile}px ${tile}px, 100% 100%`,
        maskPosition: `${(c.x - tile / 2).toFixed(1)}px ${(c.y - tile / 2).toFixed(1)}px, 0 0`,
        maskRepeat: "repeat, no-repeat",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      };
    },
    draw(ctx, p) {
      // couronne de repères sur le front de la trame
      const R = c.R * 1.08 * ease.expo(p);
      const n = 90;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ctx.fillStyle = rgba(i % 3 ? c.colors[0] : c.colors[1], 0.8 * (1 - p));
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R, 2.4 * (1 - p) + 0.6, 0, 7);
        ctx.fill();
      }
    },
  };
}

// Un fil tendu descend : la nouvelle page se déroule au-dessus, des cadres photo pendent du fil
function thread(c) {
  const [coral, violet, sun, aubergine] = c.colors;
  const sag = (x, p) => 78 * Math.sin((Math.PI * x) / c.W) * (1 - 0.45 * p) + 12 * Math.sin(x * 0.011 + p * 9);
  const lineY = (x, p) => lerp(-260, c.H + 300, ease.p3(p)) + sag(x, p);
  const frames = [0.12, 0.31, 0.5, 0.69, 0.88].map((u, i) => ({ u, i, g: [violet, sun, aubergine, coral, violet][i], h: [sun, coral, violet, sun, coral][i] }));
  return {
    duration: 1400,
    unlockAt: 0.3,
    newAt: (p) => {
      const pts = [[0, 0], [c.W, 0]];
      for (let i = 40; i >= 0; i--) pts.push([(i / 40) * c.W, lineY((i / 40) * c.W, p)]);
      return { clipPath: poly(pts) };
    },
    draw(ctx, p, now) {
      // le fil
      ctx.lineCap = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = coral;
      ctx.shadowColor = rgba(aubergine, 0.4);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const x = (i / 60) * c.W;
        const y = lineY(x, p);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      // les cadres, suspendus au fil par une pince
      const fw = clamp(c.W * 0.075, 64, 112);
      const fh = fw * 1.25;
      frames.forEach((f) => {
        const x = f.u * c.W;
        const y = lineY(x, p);
        const rot = Math.sin(now * 0.004 + f.i * 1.7) * 0.08 + (1 - ease.out3(clamp(p * 1.4))) * 0.18 * (f.i % 2 ? 1 : -1);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.shadowColor = rgba(aubergine, 0.35);
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "#fffaf2";
        ctx.fillRect(-fw / 2, 10, fw, fh);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        const g = ctx.createLinearGradient(-fw / 2, 16, fw / 2, fh);
        g.addColorStop(0, f.g);
        g.addColorStop(1, f.h);
        ctx.fillStyle = g;
        ctx.fillRect(-fw / 2 + fw * 0.08, 10 + fw * 0.08, fw * 0.84, fh * 0.74);
        ctx.fillStyle = rgba(aubergine, 0.45);
        ctx.fillRect(-fw / 2 + fw * 0.08, 10 + fh * 0.88, fw * 0.45, 4);
        ctx.fillStyle = aubergine;
        ctx.fillRect(-4, -14, 8, 30);
        ctx.restore();
      });
    },
  };
}

// Balayage de décodage : une ligne néon descend, l'écran se décode derrière elle, rangée par rangée
function scan(c) {
  const band = Math.min(220, c.H * 0.28);
  const glyph = "0123456789ABCDEF";
  return {
    duration: 1350,
    unlockAt: 0.34,
    newAt: (p) => {
      const y = c.H * ease.p3(p);
      return {
        maskImage: `linear-gradient(#000, #000), repeating-linear-gradient(180deg, #000 0 3px, transparent 3px ${3 + Math.round(10 * (1 - p))}px)`,
        maskSize: `100% ${y.toFixed(1)}px, 100% ${band}px`,
        maskPosition: `0 0, 0 ${y.toFixed(1)}px`,
        maskRepeat: "no-repeat",
      };
    },
    oldAt: (p) => ({ filter: `saturate(${(1 - 0.7 * p).toFixed(3)}) brightness(${(1 - 0.45 * p).toFixed(3)}) contrast(${(1 + 0.3 * p).toFixed(3)})` }),
    draw(ctx, p, now) {
      const y = c.H * ease.p3(p);
      const g = ctx.createLinearGradient(0, y - band, 0, y + 6);
      g.addColorStop(0, rgba(c.colors[0], 0));
      g.addColorStop(1, rgba(c.colors[0], 0.22));
      ctx.fillStyle = g;
      ctx.fillRect(0, y - band, c.W, band + 6);
      ctx.shadowColor = c.colors[0];
      ctx.shadowBlur = 22;
      ctx.fillStyle = c.colors[0];
      ctx.fillRect(0, y - 1, c.W, 2.5);
      ctx.shadowBlur = 0;
      // fragments de « décodage » sur la ligne, en bruit pseudo-aléatoire qui change à chaque image
      const rnd = seeded(Math.floor(now / 70) + 7);
      ctx.font = `500 ${clamp(c.W * 0.011, 11, 15)}px ui-monospace, Menlo, Consolas, monospace`;
      for (let i = 0; i < 9; i++) {
        const x = rnd() * c.W;
        const w = 40 + rnd() * 160;
        ctx.fillStyle = rgba(i % 3 ? c.colors[0] : c.colors[1], 0.28 + rnd() * 0.3);
        ctx.fillRect(x, y - 2 - rnd() * band * 0.5, w, 2);
      }
      ctx.fillStyle = rgba(c.colors[1], 0.95);
      for (let i = 0; i < 4; i++) {
        const txt = `0x${glyph[(rnd() * 16) | 0]}${glyph[(rnd() * 16) | 0]}${glyph[(rnd() * 16) | 0]}${glyph[(rnd() * 16) | 0]}`;
        ctx.fillText(txt, 24 + i * 78, y - 12 - (i % 2) * 14);
      }
      ctx.fillText(`DÉCODAGE ${String(Math.round(p * 100)).padStart(3, "0")} %`, c.W - 190, y - 14);
    },
  };
}

// Store vénitien : les lames se ferment sur l'ancienne page, un éclair, puis s'ouvrent sur la nouvelle
function blinds(c) {
  const n = 10;
  const tile = c.H / n;
  const [steel, coral, night] = c.colors;
  const SWAP = 0.36;
  const h = (i, p) => {
    if (p < SWAP) return clamp((p / (SWAP * 0.82) - i * 0.045) / 0.62);
    return 1 - clamp(((p - SWAP - 0.06) / 0.58 - i * 0.05) / 0.58);
  };
  return {
    duration: 1600,
    unlockAt: 0.5,
    newAt: (p) => ({ opacity: p < SWAP ? 0 : 1 }),
    oldAt: (p) => ({ opacity: p < SWAP ? 1 : 0 }),
    draw(ctx, p) {
      for (let i = 0; i < n; i++) {
        const k = ease.p2(h(i, p));
        if (k <= 0.001) continue;
        const hh = k * tile * 1.04 + 1;
        const y = i * tile + tile / 2 - hh / 2;
        const g = ctx.createLinearGradient(0, y, 0, y + hh);
        g.addColorStop(0, "#16213f");
        g.addColorStop(0.5, night);
        g.addColorStop(1, "#0a1020");
        ctx.fillStyle = g;
        ctx.fillRect(0, y, c.W, hh);
        ctx.fillStyle = rgba(steel, 0.65 * k);
        ctx.fillRect(0, y, c.W, 1.6);
        ctx.fillStyle = rgba(coral, 0.5 * k);
        ctx.fillRect(0, y + hh - 1.6, c.W, 1.2);
      }
      // cordons du store
      const closed = p < SWAP + 0.1 ? clamp(p / SWAP) : clamp(1 - (p - SWAP - 0.1) / 0.5);
      ctx.fillStyle = rgba("#9db3d6", 0.6 * closed);
      ctx.fillRect(c.W * 0.1, 0, 3, c.H);
      ctx.fillRect(c.W * 0.9, 0, 3, c.H);
      // éclair au moment où le store est fermé
      const flash = Math.max(0, 1 - Math.abs(p - SWAP) / 0.055);
      if (flash > 0) {
        const g = ctx.createRadialGradient(c.W / 2, c.H / 2, 0, c.W / 2, c.H / 2, Math.max(c.W, c.H) * 0.7);
        g.addColorStop(0, `rgba(235,244,255,${0.75 * flash})`);
        g.addColorStop(1, `rgba(74,134,214,${0.25 * flash})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c.W, c.H);
      }
    },
  };
}

// Ticket déchiré : la page se déchire de gauche à droite sur un bord perforé, le reste de l'ancienne page s'enfuit
function tear(c) {
  const [yellow, red, paper] = c.colors;
  const rnd = seeded(31);
  const jitter = Array.from({ length: Math.ceil(c.H / 7) + 2 }, () => rnd() * 7);
  const edge = (y, p) => {
    const base = lerp(-140, c.W + 160, ease.p3(p));
    const tri = Math.abs(((y / 15) % 2) - 1);
    return base + tri * 17 + jitter[Math.floor(y / 7)] * 0.9 + Math.sin(y * 0.012 + p * 6) * 10 * (1 - p);
  };
  const shift = (p) => ease.p2(p) * 90;
  const edgePts = (p) => {
    const pts = [];
    for (let y = 0; y <= c.H + 7; y += 7) pts.push([edge(y, p), y]);
    return pts;
  };
  return {
    duration: 1250,
    unlockAt: 0.3,
    oldOnTop: true,
    oldAt: (p) => ({
      clipPath: poly([...edgePts(p), [c.W + 200, c.H + 7], [c.W + 200, 0]]),
      transform: `translate(${shift(p).toFixed(1)}px, ${(-ease.p2(p) * 24).toFixed(1)}px) rotate(${(-ease.p2(p) * 1.6).toFixed(2)}deg)`,
      transformOrigin: "100% 0",
    }),
    draw(ctx, p) {
      const dx = shift(p);
      const pts = edgePts(p).map(([x, y]) => [x + dx, y]);
      // l'ombre que le morceau arraché jette sur la nouvelle page
      const g = ctx.createLinearGradient(pts[0][0] - 70, 0, pts[0][0] + 6, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.38)");
      ctx.fillStyle = g;
      ctx.fillRect(pts[0][0] - 70, 0, 76, c.H);
      // la bordure du ticket, dentelée, et les perforations
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + 13, pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = paper;
      ctx.fill();
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + 5, pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = yellow;
      ctx.fill();
      for (let y = 18; y < c.H; y += 36) {
        ctx.fillStyle = red;
        ctx.beginPath();
        ctx.arc(edge(y, p) + dx + 20, y, 3.4, 0, 7);
        ctx.fill();
      }
    },
  };
}

// Mosaïque : la nouvelle page se reconstruit par blocs, dans l'ordre d'une matrice de Bayer, depuis le clic
function pixels(c) {
  const cols = 48;
  const rows = Math.max(20, Math.round((cols * c.H) / c.W));
  const rnd = seeded(5);
  const maxD = Math.hypot(Math.max(c.x, c.W - c.x) / c.W, Math.max(c.y, c.H - c.y) / c.H);
  const thr = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const d = Math.hypot((i + 0.5) / cols - c.x / c.W, (j + 0.5) / rows - c.y / c.H) / maxD;
      thr.push(0.5 * (BAYER[(j % 4) * 4 + (i % 4)] / 15) + 0.38 * d + 0.12 * rnd());
    }
  }
  const cache = new Map();
  const frame = (step) => {
    if (cache.has(step)) return cache.get(step);
    const cv = document.createElement("canvas");
    cv.width = cols;
    cv.height = rows;
    const g = cv.getContext("2d");
    const level = (step / 40) * 1.02;
    g.fillStyle = "#000";
    thr.forEach((t, k) => {
      if (level > t) g.fillRect(k % cols, Math.floor(k / cols), 1, 1);
    });
    const url = `url(${cv.toDataURL()})`;
    cache.set(step, url);
    return url;
  };
  return {
    duration: 1150,
    unlockAt: 0.34,
    newAt: (p) => ({
      maskImage: frame(Math.round(ease.p2(p) * 40)),
      maskSize: "100% 100%",
      maskRepeat: "no-repeat",
      imageRendering: "pixelated",
    }),
    draw(ctx, p) {
      // quelques blocs d'accent qui scintillent sur le front de la mosaïque
      const level = ease.p2(p) * 1.02;
      const cw = c.W / cols;
      const ch = c.H / rows;
      ctx.fillStyle = rgba(c.colors[0], 0.55 * (1 - p));
      thr.forEach((t, k) => {
        if (Math.abs(level - t) < 0.012) ctx.fillRect((k % cols) * cw, Math.floor(k / cols) * ch, cw, ch);
      });
    },
  };
}

// Liquide : il monte, couvre tout l'écran (la page change dessous), puis s'écoule vers le bas en laissant des filets
function flood(c) {
  const [pink, yellow, cocoa] = c.colors;
  const water = c.style === "water"; // Navy Bongo : de l'eau et de l'écume au lieu du chocolat
  const SWAP = 0.5;
  const strands = Array.from({ length: 16 }, (_, i) => {
    const r = seeded(11 + i);
    return { x: (i + 0.5 + (r() - 0.5) * 0.7) / 16, w: 10 + r() * 22, len: 90 + r() * 230, ph: r() * 6 };
  });
  const level = (p) =>
    p < SWAP ? lerp(c.H + 80, -90, ease.p2(p / SWAP)) : lerp(-90, c.H + 340, ease.p3((p - SWAP) / (1 - SWAP)));
  const wave = (x, p, now) => Math.sin(x * 0.009 + now * 0.006) * 20 + Math.sin(x * 0.021 - now * 0.004) * 11 + Math.sin(x * 0.004 + p * 5) * 16;
  return {
    duration: 1600,
    unlockAt: 0.55,
    newAt: (p) => ({ opacity: p < SWAP ? 0 : 1 }),
    oldAt: (p) => ({ opacity: p < SWAP ? 1 : 0 }),
    draw(ctx, p, now) {
      const base = level(p);
      const draining = p >= SWAP;
      const top = (x) => base + wave(x, p, now);
      ctx.beginPath();
      ctx.moveTo(0, c.H + 400);
      for (let x = 0; x <= c.W + 8; x += 8) ctx.lineTo(x, top(x));
      ctx.lineTo(c.W + 8, c.H + 400);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, Math.max(-100, base - 40), 0, c.H + 80);
      g.addColorStop(0, water ? "#2a86d1" : "#6b3317");
      g.addColorStop(0.35, water ? "#14609f" : "#4a220d");
      g.addColorStop(1, cocoa);
      ctx.fillStyle = g;
      ctx.fill();
      // filets de chocolat qui s'étirent vers le haut pendant que la surface descend
      if (draining && !water) {
        const k = clamp(1 - (p - SWAP) / 0.38);
        ctx.fillStyle = "#4a220d";
        strands.forEach((s) => {
          const x = s.x * c.W;
          const len = s.len * k * (0.75 + 0.25 * Math.sin(now * 0.008 + s.ph));
          if (len < 2) return;
          const w = s.w * (0.5 + 0.5 * k);
          ctx.beginPath();
          ctx.moveTo(x - w * 1.4, top(x) + 4);
          ctx.quadraticCurveTo(x - w * 0.4, top(x) - len * 0.55, x - w * 0.4, top(x) - len);
          ctx.arc(x, top(x) - len, w * 0.4, Math.PI, 0);
          ctx.quadraticCurveTo(x + w * 0.4, top(x) - len * 0.55, x + w * 1.4, top(x) + 4);
          ctx.closePath();
          ctx.fill();
        });
      }
      // lèvre brillante à la surface
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = water ? "rgba(255,255,255,0.92)" : rgba(yellow, 0.9);
      ctx.beginPath();
      for (let x = 0; x <= c.W + 8; x += 8) (x ? ctx.lineTo(x, top(x) + 3) : ctx.moveTo(x, top(x) + 3));
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = water ? rgba("#bfe9ff", 0.7) : rgba(pink, 0.8);
      ctx.beginPath();
      for (let x = 0; x <= c.W + 8; x += 8) (x ? ctx.lineTo(x, top(x) + 12) : ctx.moveTo(x, top(x) + 12));
      ctx.stroke();
    },
  };
}

// Portes : deux battants se ferment sur l'ancienne page (journal, rame de métro ou coffre au trésor selon le monde),
// la page change dessous, les battants s'ouvrent sur la nouvelle
function doors(c) {
  const SWAP = 0.4;
  const skin = c.skin || "news";
  const pw = c.W / 2;
  const hold = 0.06;
  // ouverture des battants : 1 = fermés, 0 = grands ouverts
  const k = (p) => {
    if (p < SWAP) return ease.out3(p / SWAP);
    if (p < SWAP + hold) return 1;
    return 1 - ease.p3((p - SWAP - hold) / (1 - SWAP - hold));
  };
  const art = {
    news(ctx, w, h, side) {
      ctx.fillStyle = "#ece5d6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#141414";
      ctx.fillRect(w * 0.06, h * 0.07, w * 0.88, 3);
      ctx.fillRect(w * 0.06, h * 0.07 + 7, w * 0.88, 1.5);
      ctx.font = `italic 700 ${Math.round(clamp(w * 0.085, 22, 60))}px "Abril Fatface", Georgia, serif`;
      ctx.textAlign = side === "l" ? "right" : "left";
      ctx.fillText("Le Manager", side === "l" ? w * 0.94 : w * 0.06, h * 0.07 + 54);
      ctx.fillRect(w * 0.06, h * 0.07 + 70, w * 0.88, 1.5);
      ctx.textAlign = "left";
      const rnd = seeded(side === "l" ? 3 : 8);
      for (let col = 0; col < 3; col++) {
        for (let r = 0; r < 26; r++) {
          const y = h * 0.28 + r * (h * 0.027);
          if (y > h * 0.94) break;
          ctx.fillStyle = `rgba(20,20,20,${0.26 + rnd() * 0.2})`;
          ctx.fillRect(w * 0.06 + col * w * 0.3, y, w * (0.2 + rnd() * 0.06), 3);
        }
      }
      ctx.fillStyle = "#c8321e";
      ctx.fillRect(w * 0.06, h * 0.22, w * 0.18, 5);
      ctx.fillStyle = "rgba(20,20,20,0.82)";
      ctx.fillRect(w * 0.06, h * 0.24, w * 0.88, h * 0.026);
    },
    metro(ctx, w, h, side) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#cfd5d3");
      g.addColorStop(0.5, "#e9ecea");
      g.addColorStop(1, "#cfd5d3");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const gx = w * 0.18;
      const gw = w * 0.64;
      const glass = ctx.createLinearGradient(gx, h * 0.14, gx + gw, h * 0.72);
      glass.addColorStop(0, "#2f86e0");
      glass.addColorStop(1, "#0b3b6f");
      ctx.fillStyle = "#2a2e33";
      ctx.fillRect(gx - 8, h * 0.14 - 8, gw + 16, h * 0.58 + 16);
      ctx.fillStyle = glass;
      ctx.fillRect(gx, h * 0.14, gw, h * 0.58);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(gx + gw * 0.15, h * 0.14);
      ctx.lineTo(gx + gw * 0.45, h * 0.14);
      ctx.lineTo(gx + gw * 0.15, h * 0.72);
      ctx.lineTo(gx - 20, h * 0.72);
      ctx.fill();
      const stripe = 34;
      for (let x = -stripe; x < w + stripe; x += stripe * 2) {
        ctx.fillStyle = "#f2c13b";
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + stripe, h);
        ctx.lineTo(x + stripe * 1.5, h * 0.91);
        ctx.lineTo(x + stripe * 0.5, h * 0.91);
        ctx.fill();
      }
      const seam = side === "l" ? w - 12 : 0;
      ctx.fillStyle = "#15171a";
      ctx.fillRect(seam, 0, 12, h);
      ctx.fillStyle = "#49b8a5";
      ctx.fillRect(side === "l" ? w - 30 : 18, h * 0.045, 12, 6);
      ctx.fillStyle = "#e0242b";
      ctx.fillRect(side === "l" ? w - 50 : 38, h * 0.045, 12, 6);
    },
    chest(ctx, w, h, side) {
      const plank = 72;
      for (let x = 0; x < w; x += plank) {
        const i = Math.round(x / plank);
        ctx.fillStyle = i % 2 ? "#6b4a2f" : "#5d3f27";
        ctx.fillRect(x, 0, plank, h);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x, 0, 2, h);
        ctx.fillStyle = "rgba(255,210,150,0.06)";
        for (let y = 20; y < h; y += 60) ctx.fillRect(x + 12, y + (i % 3) * 9, plank - 28, 2);
      }
      [0.14, 0.5, 0.86].forEach((f) => {
        ctx.fillStyle = "#26282c";
        ctx.fillRect(0, h * f - 22, w, 44);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(0, h * f - 22, w, 3);
        ctx.fillStyle = "#8b8f96";
        for (let x = 24; x < w; x += 70) {
          ctx.beginPath();
          ctx.arc(x, h * f, 5, 0, 7);
          ctx.fill();
        }
      });
      const seamX = side === "l" ? w - 8 : 8;
      ctx.fillStyle = "#c8a45a";
      ctx.fillRect(side === "l" ? w - 16 : 0, 0, 16, h);
      ctx.beginPath();
      ctx.arc(seamX, h / 2, 52, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#15110d";
      ctx.beginPath();
      ctx.arc(seamX, h / 2 - 8, 11, 0, 7);
      ctx.fill();
      ctx.fillRect(seamX - 6, h / 2 - 8, 12, 30);
    },
  }[skin];

  return {
    duration: 1700,
    unlockAt: 0.52,
    newAt: (p) => ({ opacity: p < SWAP + 0.02 ? 0 : 1 }),
    oldAt: (p) => ({ opacity: p < SWAP + 0.02 ? 1 : 0 }),
    draw(ctx, p) {
      const open = k(p);
      // la lumière du coffre qui filtre par la fente
      if (skin === "chest" && p > SWAP + hold - 0.02) {
        const glow = clamp(1 - open) * 1;
        const g = ctx.createRadialGradient(c.W / 2, c.H / 2, 0, c.W / 2, c.H / 2, c.W * 0.55);
        g.addColorStop(0, `rgba(255,222,140,${0.95 * glow})`);
        g.addColorStop(1, "rgba(255,222,140,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, c.W, c.H);
      }
      const edge = pw * open;
      if (edge < 1) return;
      [["l", edge - pw], ["r", c.W - edge]].forEach(([side, x]) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(side === "l" ? 0 : c.W - edge, 0, edge, c.H);
        ctx.clip();
        ctx.translate(x, 0);
        art(ctx, pw, c.H, side);
        // ombre portée sur la page qui apparaît
        const g = ctx.createLinearGradient(side === "l" ? pw : 0, 0, side === "l" ? pw - 90 : 90, 0);
        g.addColorStop(0, "rgba(0,0,0,0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, pw, c.H);
        ctx.restore();
      });
    },
  };
}

// Brume ou fumée : de grandes masses douces dérivent, couvrent tout l'écran, la page change dessous, puis elles se lèvent
function fog(c) {
  const SWAP = 0.46;
  const rnd = seeded(23);
  const up = c.direction === "up";
  const color = c.fogColor || c.colors[0];
  const blobs = Array.from({ length: 30 }, () => ({
    x: rnd(),
    y: rnd(),
    r: 200 + rnd() * 320,
    s: 0.4 + rnd() * 0.9,
    ph: rnd() * 6.28,
  }));
  const level = (p) => (p < SWAP ? ease.p2(p / SWAP) : 1 - ease.p2((p - SWAP) / (1 - SWAP)));
  return {
    duration: 1700,
    unlockAt: 0.55,
    newAt: (p) => ({ opacity: p < SWAP ? 0 : 1, filter: `blur(${(p < SWAP ? 0 : 14 * (1 - level(p))).toFixed(1)}px)` }),
    oldAt: (p) => ({ opacity: p < SWAP ? 1 : 0, filter: `blur(${(10 * level(Math.min(p, SWAP))).toFixed(1)}px)` }),
    draw(ctx, p, now) {
      const a = level(p);
      ctx.fillStyle = rgba(color, Math.pow(a, 2.2) * 0.96);
      ctx.fillRect(0, 0, c.W, c.H);
      blobs.forEach((b) => {
        const drift = (now * 0.00003 * b.s + b.ph) % 1;
        const x = up ? b.x * c.W + Math.sin(now * 0.0006 * b.s + b.ph) * 80 : ((b.x + drift) % 1.3) * c.W * 1.2 - c.W * 0.1;
        const y = up ? c.H * (1.25 - ((b.y + drift * 1.4) % 1.35) * (1 + a * 0.2)) : b.y * c.H + Math.sin(now * 0.0005 + b.ph) * 40;
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, rgba(color, 0.7 * a));
        g.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
      });
    },
  };
}

// Rideau de pluie : la nouvelle page descend depuis le haut, son bord s'étire en gouttes qui coulent
function rain(c) {
  const rnd = seeded(61);
  const N = 28;
  const drips = Array.from({ length: N }, (_, i) => ({ x: ((i + 0.5 + (rnd() - 0.5) * 0.7) / N) * c.W, len: 50 + rnd() * 230, w: (c.W / N) * (0.5 + rnd() * 0.45), d: rnd() * 0.25 }));
  const front = (p) => lerp(-80, c.H + 360, ease.p3(p));
  const edge = (x, p) => {
    let y = front(p);
    const grow = Math.sin(clamp(p * 1.15) * Math.PI);
    drips.forEach((d) => {
      const dx = (x - d.x) / d.w;
      if (Math.abs(dx) < 3) y += d.len * grow * Math.exp(-dx * dx);
    });
    return y;
  };
  const edgePts = (p) => {
    const pts = [];
    for (let x = 0; x <= c.W + 6; x += 6) pts.push([x, edge(x, p)]);
    return pts;
  };
  return {
    duration: 1500,
    unlockAt: 0.34,
    newAt: (p) => ({ clipPath: poly([[0, -10], [c.W, -10], ...edgePts(p).reverse()]) }),
    oldAt: (p) => ({ filter: `blur(${(5 * p).toFixed(1)}px) brightness(${(1 - 0.35 * p).toFixed(2)})` }),
    draw(ctx, p, now) {
      const col = c.colors[0];
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = rgba(col, 0.9 * (1 - p * 0.5));
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      edgePts(p).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.shadowBlur = 0;
      // gouttes au bout des filets
      drips.forEach((d) => {
        const y = edge(d.x, p);
        if (y < 0 || y > c.H + 20) return;
        ctx.fillStyle = rgba("#e9f2ff", 0.85);
        ctx.beginPath();
        ctx.ellipse(d.x, y + 4, d.w * 0.35, d.w * 0.5, 0, 0, 7);
        ctx.fill();
      });
      // pluie fine en diagonale
      const r = seeded(Math.floor(now / 40) + 3);
      ctx.strokeStyle = rgba("#cfe0ee", 0.28);
      ctx.lineWidth = 1;
      for (let i = 0; i < 90; i++) {
        const x = r() * c.W;
        const y = r() * c.H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 24 + r() * 20);
        ctx.stroke();
      }
    },
  };
}

// Plan d'architecte : la nouvelle page se dessine pièce par pièce sur une grille de cotes, depuis le clic
function draft(c) {
  const cols = 8;
  const rows = Math.max(4, Math.round((cols * c.H) / c.W));
  const cw = c.W / cols;
  const ch = c.H / rows;
  const rnd = seeded(77);
  const maxD = Math.hypot(Math.max(c.x, c.W - c.x), Math.max(c.y, c.H - c.y));
  const cells = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const d = Math.hypot((i + 0.5) * cw - c.x, (j + 0.5) * ch - c.y) / maxD;
      cells.push({ i, j, at: 0.04 + d * 0.62 + rnd() * 0.1 });
    }
  }
  const SPAN = 0.2;
  const visible = (cell, p) => ease.p2(clamp((ease.p2(p) * 1.12 - cell.at) / SPAN));
  return {
    duration: 1500,
    unlockAt: 0.4,
    newAt: (p) => {
      let d = "";
      cells.forEach((cell) => {
        const v = visible(cell, p);
        if (v <= 0) return;
        const w = cw * v + 0.6;
        const h = ch * v + 0.6;
        const x = cell.i * cw + (cw - w) / 2 - 0.3;
        const y = cell.j * ch + (ch - h) / 2 - 0.3;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}z`;
      });
      return { clipPath: d ? `path('${d}')` : "path('M0 0h0v0z')" };
    },
    oldAt: (p) => ({ filter: `brightness(${(1 - 0.5 * p).toFixed(2)})` }),
    draw(ctx, p) {
      const line = c.colors[0];
      ctx.lineWidth = 1;
      ctx.font = `500 ${clamp(c.W * 0.0085, 10, 13)}px "Share Tech Mono", ui-monospace, monospace`;
      cells.forEach((cell) => {
        const v = visible(cell, p);
        if (v <= 0 || v >= 1) {
          if (v >= 1) {
            ctx.strokeStyle = rgba(line, 0.28 * (1 - p));
            ctx.strokeRect(cell.i * cw + 0.5, cell.j * ch + 0.5, cw, ch);
          }
          return;
        }
        const w = cw * v;
        const h = ch * v;
        const x = cell.i * cw + (cw - w) / 2;
        const y = cell.j * ch + (ch - h) / 2;
        ctx.strokeStyle = rgba(line, 0.95);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = rgba(line, 0.95);
        ctx.fillText(`${(cw * 0.026 * v).toFixed(2)} m`, x + 6, y + 14);
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillRect(x + w - 3, y + h - 3, 6, 6);
      });
    },
  };
}

// Projectile : un ballon rebondit (ou un oiseau est lancé) jusqu'au clic, l'impact ouvre la nouvelle page
function projectile(c) {
  const IMPACT = 0.4;
  const bird = c.sprite === "bird";
  const [main, second, ink] = c.colors;
  const sx = bird ? -60 : clamp(c.x - c.W * 0.32, 60, c.W - 60);
  const sy = bird ? c.H * 0.86 : -60;
  const pos = (u) => {
    if (bird) {
      return [lerp(sx, c.x, u), lerp(sy, c.y, u) - Math.sin(u * Math.PI) * c.H * 0.46];
    }
    // trois rebonds de moins en moins hauts, jusqu'au point d'impact
    const floor = c.y;
    const x = lerp(sx, c.x, u);
    const bounces = 3;
    const phase = u * bounces;
    const k = Math.floor(Math.min(phase, bounces - 0.001));
    const f = phase - k;
    const top = k === 0 ? sy : floor - (c.H * 0.38) * Math.pow(0.5, k);
    const y = f < 0.5 ? lerp(top, floor, Math.pow(f * 2, 2)) : lerp(floor, floor - (c.H * 0.38) * Math.pow(0.5, k + 1), 1 - Math.pow(1 - (f - 0.5) * 2, 2));
    return [x, Math.min(y, floor)];
  };
  const q = (p) => clamp((p - IMPACT + 0.02) / (1 - IMPACT + 0.02));
  return {
    duration: 1500,
    unlockAt: 0.5,
    newAt: (p) => ({ clipPath: `circle(${(c.R * 1.05 * ease.expo(q(p))).toFixed(1)}px at ${c.x}px ${c.y}px)` }),
    draw(ctx, p) {
      const u = clamp(p / IMPACT);
      if (p < IMPACT + 0.03) {
        for (let i = 7; i >= 0; i--) {
          const [tx, ty] = pos(Math.max(0, u - i * 0.018));
          ctx.fillStyle = rgba(main, (1 - i / 8) * 0.35);
          ctx.beginPath();
          ctx.arc(tx, ty, 12 - i, 0, 7);
          ctx.fill();
        }
        const [bx, by] = pos(u);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(u * 14);
        if (bird) {
          ctx.fillStyle = main;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#f6d9b0";
          ctx.beginPath();
          ctx.ellipse(3, 9, 16, 12, 0, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#f2a31b";
          ctx.beginPath();
          ctx.moveTo(14, -2);
          ctx.lineTo(34, 5);
          ctx.lineTo(14, 11);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(8, -8, 6, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#111";
          ctx.beginPath();
          ctx.arc(10, -7, 2.6, 0, 7);
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(-8, -8, 4, 0, 0, 30);
          g.addColorStop(0, "#ffa04d");
          g.addColorStop(0.6, main);
          g.addColorStop(1, "#b94d00");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, 30, 0, 7);
          ctx.fill();
          ctx.strokeStyle = ink;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(-30, 0);
          ctx.lineTo(30, 0);
          ctx.moveTo(0, -30);
          ctx.lineTo(0, 30);
          ctx.arc(0, 0, 30, 0, 7);
          ctx.stroke();
        }
        ctx.restore();
      }
      // onde de choc et débris à l'impact
      if (p >= IMPACT - 0.02) {
        const k = clamp((p - IMPACT + 0.02) / 0.5);
        const r = ease.out3(k) * c.R * 0.7;
        ctx.strokeStyle = rgba(second, (1 - k) * 0.95);
        ctx.lineWidth = 6 * (1 - k) + 1;
        ctx.shadowColor = second;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, 7);
        ctx.stroke();
        ctx.shadowBlur = 0;
        const rnd = seeded(5);
        for (let i = 0; i < 22; i++) {
          const a = rnd() * 6.28;
          const v = 80 + rnd() * 380;
          const d = v * ease.out3(k);
          ctx.fillStyle = rgba(i % 2 ? main : second, 1 - k);
          ctx.fillRect(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d + k * k * 120, 7, 7);
        }
      }
    },
  };
}

// Projecteur : un faisceau balaie l'écran en diagonale, la nouvelle page se révèle dans son sillage
function sweep(c) {
  const slope = 0.32;
  const front = (p) => lerp(-c.H * slope - 80, c.W + 80, ease.p3(p));
  return {
    duration: 1300,
    unlockAt: 0.34,
    newAt: (p) => {
      const f = front(p);
      return { clipPath: poly([[0, 0], [f, 0], [f - c.H * slope, c.H], [0, c.H]]) };
    },
    oldAt: (p) => ({ filter: `brightness(${(1 - 0.5 * p).toFixed(2)})` }),
    draw(ctx, p) {
      const f = front(p);
      const [a, b] = c.colors;
      // le cône de lumière, du haut de l'écran vers le bas
      const g = ctx.createLinearGradient(f - 160, 0, f + 40, 0);
      g.addColorStop(0, rgba(a, 0));
      g.addColorStop(0.7, rgba(a, 0.22));
      g.addColorStop(1, rgba(b, 0.55));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(f - 160, 0);
      ctx.lineTo(f + 6, 0);
      ctx.lineTo(f - c.H * slope + 6, c.H);
      ctx.lineTo(f - c.H * slope - 160, c.H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba("#ffffff", 0.85);
      ctx.lineWidth = 3;
      ctx.shadowColor = b;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(f, 0);
      ctx.lineTo(f - c.H * slope, c.H);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  };
}

// Retournement : l'ancienne page bascule en perspective et laisse place à la nouvelle, qui se redresse
function flip(c) {
  const SWAP = 0.5;
  const dir = c.flipAxis === "y" ? "Y" : "X";
  return {
    duration: 1250,
    unlockAt: 0.55,
    oldAt: (p) => ({
      opacity: p < SWAP ? 1 : 0,
      transform: `perspective(1500px) rotate${dir}(${(-90 * ease.p3(clamp(p / SWAP))).toFixed(2)}deg) scale(${(1 - 0.08 * clamp(p / SWAP)).toFixed(3)})`,
    }),
    newAt: (p) => ({
      opacity: p < SWAP ? 0 : 1,
      transform: `perspective(1500px) rotate${dir}(${(90 * (1 - ease.p3(clamp((p - SWAP) / (1 - SWAP))))).toFixed(2)}deg) scale(${(0.92 + 0.08 * clamp((p - SWAP) / (1 - SWAP))).toFixed(3)})`,
    }),
    draw(ctx, p, now) {
      // traînées de vitesse pendant la bascule, éclat au quart de tour
      const k = Math.sin(clamp(p) * Math.PI);
      const rnd = seeded(Math.floor(now / 50) + 9);
      ctx.fillStyle = rgba(c.colors[0], 0.5 * k);
      for (let i = 0; i < 38; i++) {
        const x = rnd() * c.W;
        const len = 80 + rnd() * 380;
        ctx.fillRect(x, rnd() * c.H, 2, len * k);
      }
      const flash = Math.max(0, 1 - Math.abs(p - SWAP) / 0.06);
      if (flash > 0) {
        ctx.fillStyle = rgba(c.colors[1], 0.5 * flash);
        ctx.fillRect(0, 0, c.W, c.H);
      }
    },
  };
}

// Memphis (Eko) : des formes plates à ombre dure (disques, triangles, étoiles, croix) jaillissent du clic, recouvrent
// l'écran sur un aplat pêche ; la page change dessous ; l'aplat s'ouvre en cercle depuis le clic pendant que les formes
// s'envolent en tournant (les plus proches du clic d'abord)
function memphis(c) {
  const [coral, blue, ink, green, plate, gold] = c.colors;
  const palette = [coral, blue, green, gold, "#ffffff", ink];
  const SWAP = 0.5;
  const cols = 9;
  const rows = Math.max(5, Math.round((cols * c.H) / c.W) + 1);
  const cell = Math.max(c.W / cols, c.H / rows);
  const rnd = seeded(31);
  const shapes = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5 + (rnd() - 0.5) * 0.6) / cols) * c.W;
      const y = ((j + 0.5 + (rnd() - 0.5) * 0.6) / rows) * c.H;
      shapes.push({
        x,
        y,
        kind: (i + j * 2) % 4,
        r: cell * (0.5 + rnd() * 0.32),
        color: palette[Math.floor(rnd() * palette.length)],
        rot: rnd() * 6.28,
        spin: (rnd() - 0.5) * 5,
        d: Math.hypot(x - c.x, y - c.y) / c.R,
      });
    }
  }
  const trace = (ctx, kind, r) => {
    ctx.beginPath();
    if (kind === 0) {
      ctx.arc(0, 0, r, 0, 6.2832);
    } else if (kind === 1) {
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.92, r * 0.72);
      ctx.lineTo(-r * 0.92, r * 0.72);
      ctx.closePath();
    } else if (kind === 2) {
      for (let k = 0; k < 16; k++) {
        const a = (k * 6.2832) / 16 - 1.5708;
        const rr = k % 2 ? r * 0.52 : r;
        ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    } else {
      const w = r * 0.36;
      ctx.rect(-w, -r, w * 2, r * 2);
      ctx.rect(-r, -w, r * 2, w * 2);
    }
  };
  const back = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  return {
    duration: 1500,
    unlockAt: 0.55,
    newAt: (p) => ({ opacity: p < SWAP ? 0 : 1 }),
    oldAt: (p) => ({ opacity: p < SWAP ? 1 : 0 }),
    draw(ctx, p) {
      const closing = p < SWAP;
      // aplat : un disque qui s'élargit depuis le clic, puis un trou qui s'ouvre au même endroit
      const open = closing ? ease.expo(p / SWAP) : ease.expo((p - SWAP) / (1 - SWAP));
      const R = c.R * 1.02;
      ctx.fillStyle = plate;
      ctx.beginPath();
      if (closing) {
        ctx.arc(c.x, c.y, R * open, 0, 6.2832);
      } else {
        ctx.rect(0, 0, c.W, c.H);
        ctx.arc(c.x, c.y, R * open, 0, 6.2832, true);
      }
      ctx.fill("evenodd");
      shapes.forEach((s) => {
        // jaillissement (aller) puis envol (retour) selon la distance au clic
        const a = closing ? back(clamp((p / SWAP - s.d * 0.55) / 0.42)) : 1 - ease.p2(clamp(((p - SWAP) / (1 - SWAP) - s.d * 0.5) / 0.45));
        if (a <= 0.001) return;
        const fly = closing ? 0 : 1 - a;
        ctx.save();
        ctx.translate(s.x + (s.x - c.x) * fly * 0.35, s.y + (s.y - c.y) * fly * 0.35);
        ctx.rotate(s.rot + s.spin * (closing ? 1 - a : fly + 1));
        ctx.scale(a, a);
        ctx.fillStyle = ink;
        ctx.save();
        ctx.translate(s.r * 0.12, s.r * 0.12);
        trace(ctx, s.kind, s.r);
        ctx.fill("evenodd");
        ctx.restore();
        ctx.fillStyle = s.color;
        trace(ctx, s.kind, s.r);
        ctx.fill("evenodd");
        ctx.restore();
      });
    },
  };
}

export const GENRES = { iris, ink, dots, thread, scan, blinds, tear, pixels, flood, doors, fog, rain, draft, projectile, sweep, flip, memphis };

/* ---------------------------------------------------------------------------------------------------------------
   Exécution
   --------------------------------------------------------------------------------------------------------------- */

const STEP = 16; // ms entre deux valeurs échantillonnées

const sample = (fn, duration) => {
  const n = Math.max(8, Math.round(duration / STEP));
  return Array.from({ length: n + 1 }, (_, i) => ({ offset: i / n, ...fn(i / n) }));
};

// Joue la transition. swap() change la page (appelée dans le callback de la View Transition) ;
// unlock() libère les animations d'entrée de la nouvelle page.
export async function playGenre({ genre = "iris", options = {}, origin, colors, swap, unlock, onStart }) {
  const html = document.documentElement;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const x = origin ? origin.x : W / 2;
  const y = origin ? origin.y : H / 2;
  const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
  const make = GENRES[genre] || GENRES.iris;
  const spec = make({ W, H, x, y, R, colors: colors && colors.length ? colors : ["#bc63ff", "#63e6be", "#0a0a0f"], ...options });
  // Debug : window.__vtSlow = 5 ralentit la transition pour la juger image par image
  const slow = window.__vtSlow || 1;
  const duration = spec.duration * slow;

  const fx = document.querySelector(".vt-fx");
  let canvas = null;
  if (fx && spec.draw) {
    canvas = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.appendChild(canvas);
  }

  html.classList.add("is-vt");
  if (spec.oldOnTop) html.classList.add("vt-old-top");

  let swapped = false;
  const transition = document.startViewTransition(() => {
    swapped = true;
    swap();
  });

  const anims = [];
  let raf = 0;
  const cleanup = () => {
    cancelAnimationFrame(raf);
    anims.forEach((a) => a.cancel());
    if (canvas) canvas.remove();
    html.classList.remove("is-vt", "vt-old-top");
  };

  try {
    await transition.ready;
    const run = (pseudo, fn) => {
      if (!fn) return;
      anims.push(
        html.animate(sample(fn, spec.duration), {
          duration,
          easing: "linear",
          fill: "forwards",
          pseudoElement: `::view-transition-${pseudo}(root)`,
        })
      );
    };
    run("new", spec.newAt);
    run("old", spec.oldAt);

    const ctx = canvas ? canvas.getContext("2d") : null;
    const drawAt = (p, now) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      spec.draw(ctx, p, now / slow);
    };

    // Debug (dev) : window.__vtFreeze = 0.4 fige la transition à 40 % ; window.__vtRelease() la reprend
    let startP = 0;
    if (process.env.NODE_ENV === "development" && typeof window.__vtFreeze === "number") {
      startP = window.__vtFreeze;
      delete window.__vtFreeze;
      anims.forEach((a) => {
        a.pause();
        a.currentTime = startP * duration;
      });
      drawAt(startP, performance.now());
      await new Promise((resolve) => {
        window.__vtRelease = resolve;
      });
      anims.forEach((a) => a.play());
    }

    if (ctx) {
      const t0 = performance.now() - startP * duration;
      const tick = (now) => {
        const p = clamp((now - t0) / duration);
        drawAt(p, now);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    if (onStart) onStart();
    setTimeout(unlock, duration * (spec.unlockAt || 0.35));
  } catch (e) {
    // Le navigateur a abandonné la transition : la page a quand même changé
  }

  await transition.updateCallbackDone.catch(() => {});
  if (!swapped) swap();
  await transition.finished.catch(() => {});
  cleanup();
  return spec;
}
