import i18n from "../i18n";
import { gsap, prefersReducedMotion } from "./motion";
import { play } from "./sound";
import "../css/Copy.css";

// Double clic : plus de mot ni de ligne surlignés, nulle part sur le site (le glisser sélectionne toujours).
// Clic simple sur un texte qui n'est pas un bouton : le bloc de texte touché (titre, paragraphe, élément de liste…)
// est copié dans le presse-papiers, avec un effet : ses lignes sont balayées par un surligneur, un anneau part du
// pointeur et une pastille « Copié » monte.

// Tout ce qui a son propre geste, ou n'est pas du texte à lire
const SKIP =
  'a, button, [role="button"], input, textarea, select, label, summary, [contenteditable], iframe, video, audio, canvas, svg, ' +
  "[data-no-copy], .hud, .cursor, .preloader, .click-fx, .grain, .copyfx";
const FIELDS = "input, textarea, select, [contenteditable]";
const MAX_CHARS = 1600;

// Le point tombe-t-il sur une lettre ? Renvoie le nœud de texte touché (le navigateur donne sinon la position de
// curseur la plus proche, même loin du texte)
function textNodeAt(x, y, target) {
  let node = null;
  let offset = 0;
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (position) {
      node = position.offsetNode;
      offset = position.offset;
    }
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE || !target.contains(node)) return null;
  const length = node.nodeValue.length;
  const range = document.createRange();
  const pairs = [
    [Math.max(0, offset - 1), offset],
    [offset, Math.min(length, offset + 1)],
  ];
  for (let i = 0; i < pairs.length; i += 1) {
    const [a, b] = pairs[i];
    if (a !== b) {
      range.setStart(node, a);
      range.setEnd(node, b);
      const rects = range.getClientRects();
      for (let j = 0; j < rects.length; j += 1) {
        const r = rects[j];
        if (x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3) return node;
      }
    }
  }
  return null;
}

// Premier ancêtre qui a une boîte de bloc : les lettres et mots découpés (inline-block) remontent jusqu'au titre
function blockOf(node) {
  let el = node.parentElement;
  while (el && el !== document.body) {
    const display = getComputedStyle(el).display;
    if (!display.startsWith("inline") && display !== "contents") return el;
    el = el.parentElement;
  }
  return el;
}

// Les nœuds de texte que l'œil voit : ni la copie « sr-only » des titres découpés, ni ce qui est masqué
function visibleTextNodes(block) {
  const out = [];
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (node.nodeValue.trim() && parent && !parent.closest(".sr-only")) {
      const shown = parent.checkVisibility ? parent.checkVisibility({ checkVisibilityCSS: true }) : true;
      if (shown) out.push(node);
    }
    node = walker.nextNode();
  }
  return out;
}

// Les titres découpés en lettres n'ont pas de nœud « espace » entre les mots : l'écart entre deux nœuds voisins
// (ou un changement de ligne) en tient lieu
function joinNodes(nodes) {
  const range = document.createRange();
  let text = "";
  let previous = null;
  nodes.forEach((node) => {
    const value = node.nodeValue;
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    const first = rects[0];
    if (previous && first && text && !/\s$/.test(text) && !/^\s/.test(value)) {
      const size = parseFloat(getComputedStyle(node.parentElement).fontSize) || 16;
      const sameLine = Math.abs(first.top - previous.top) < size * 0.6;
      if (!sameLine || first.left - previous.right > size * 0.1) text += " ";
    }
    text += value;
    if (rects.length) previous = rects[rects.length - 1];
  });
  return text;
}

function textOf(block, nodes) {
  let text = joinNodes(nodes);
  if (!text.trim()) text = block.textContent || "";
  text = text.replace(/\s+/g, " ").trim();
  const transform = getComputedStyle(block).textTransform;
  if (transform === "uppercase") text = text.toLocaleUpperCase();
  else if (transform === "lowercase") text = text.toLocaleLowerCase();
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;
}

// Une boîte par ligne de texte (les rectangles d'une même ligne sont fusionnés)
function lineBoxes(nodes) {
  const lines = [];
  const range = document.createRange();
  nodes.forEach((node) => {
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i += 1) {
      const r = rects[i];
      if (r.width < 2 || r.height < 2) continue;
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.5 && r.left <= l.right + 12 && r.right >= l.left - 12);
      if (line) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.top = Math.min(line.top, r.top);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else {
        lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
    }
  });
  lines.sort((a, b) => a.top - b.top || a.left - b.left);
  return lines.slice(0, 14);
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // http, vieux navigateur ou permission refusée : repli par un champ caché
  }
  const active = document.activeElement;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.cssText = "position:fixed;top:-200px;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (error) {
    ok = false;
  }
  area.remove();
  if (active && active.focus) active.focus({ preventScroll: true });
  return ok;
}

export function initCopyText() {
  const live = document.createElement("div");
  live.className = "sr-only copyfx";
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);

  const layer = document.createElement("div");
  layer.className = "copyfx__layer copyfx";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const show = (x, y, lines) => {
    const reduced = prefersReducedMotion();
    const nodes = [];
    const tl = gsap.timeline({ onComplete: () => nodes.forEach((n) => n.remove()) });

    // Surligneur : un bandeau par ligne, qui balaie de gauche à droite puis s'efface
    lines.forEach((line, i) => {
      const el = document.createElement("i");
      el.className = "copyfx__line";
      el.style.cssText = `left:${line.left - 4}px;top:${line.top - 2}px;width:${line.right - line.left + 8}px;height:${line.bottom - line.top + 4}px`;
      layer.appendChild(el);
      nodes.push(el);
      if (reduced) {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0).to(el, { opacity: 0, duration: 0.4 }, 1.1);
      } else {
        tl.fromTo(el, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.42, ease: "expo.out" }, i * 0.05)
          .to(el, { opacity: 0, duration: 0.5, ease: "power2.in" }, 0.62 + i * 0.05);
      }
    });

    // Anneau qui part du pointeur
    if (!reduced) {
      const ring = document.createElement("i");
      ring.className = "copyfx__ring";
      ring.style.cssText = `left:${x}px;top:${y}px`;
      layer.appendChild(ring);
      nodes.push(ring);
      tl.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 0.7, ease: "expo.out" }, 0);
    }

    // Pastille « Copié », gardée dans l'écran
    const chip = document.createElement("span");
    chip.className = "copyfx__chip";
    chip.innerHTML =
      '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const label = document.createElement("span");
    label.textContent = i18n.t("Copy.done");
    chip.appendChild(label);
    layer.appendChild(chip);
    nodes.push(chip);
    const w = chip.offsetWidth;
    const left = Math.min(window.innerWidth - w - 10, Math.max(10, x - w / 2));
    const top = Math.max(10, y - 46);
    chip.style.cssText = `left:${left}px;top:${top}px`;
    if (reduced) {
      tl.fromTo(chip, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0).to(chip, { opacity: 0, duration: 0.3 }, 1.3);
    } else {
      tl.fromTo(chip, { y: 10, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.04)
        .to(chip, { y: -14, opacity: 0, duration: 0.45, ease: "power2.in" }, 1.15);
    }

    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = i18n.t("Copy.announce");
    }, 30);
    play("click");
  };

  // Double et triple clic : la sélection d'un mot ou d'une ligne est annulée (champs de saisie exceptés)
  const onMouseDown = (e) => {
    if (e.detail > 1 && !(e.target.closest && e.target.closest(FIELDS))) e.preventDefault();
  };

  const onClick = (e) => {
    if (e.button !== 0 || e.detail !== 1 || e.defaultPrevented) return;
    const target = e.target;
    if (!(target instanceof Element) || target.closest(SKIP)) return;
    if (document.documentElement.classList.contains("is-intro")) return;
    // Un glisser qui a sélectionné du texte n'est pas un clic de copie : le navigateur garde la sélection
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) return;

    const hit = textNodeAt(e.clientX, e.clientY, target);
    if (!hit) return;
    const block = blockOf(hit);
    if (!block || block.closest(SKIP)) return;
    const nodes = visibleTextNodes(block);
    const text = textOf(block, nodes);
    if (!text) return;

    // writeClipboard est appelé pendant le geste de l'utilisateur ; l'effet ne part que si la copie a réussi
    const lines = lineBoxes(nodes.length ? nodes : [hit]);
    writeClipboard(text).then((ok) => {
      if (ok) show(e.clientX, e.clientY, lines);
    });
  };

  document.addEventListener("mousedown", onMouseDown, true);
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("mousedown", onMouseDown, true);
    document.removeEventListener("click", onClick);
    live.remove();
    layer.remove();
  };
}
