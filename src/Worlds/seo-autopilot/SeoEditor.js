import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { gsap, prefersReducedMotion } from "../../Effects/motion";

// L'éditeur de workflow de SEO Autopilot, vivant : les six nœuds se déplacent (souris, doigt, flèches du clavier), les fils
// suivent, des paquets y circulent, et « Exécuter » joue le pipeline étape par étape (Cron → Lighthouse + WAVE → GPT →
// Google Sheets → AWS S3) jusqu'à un rapport. Les nœuds sont du HTML (lisible, focalisable), les fils du SVG.
const NODES = [
  { id: "cron", title: "Cron", color: "#7b8794" },
  { id: "lh", title: "Lighthouse", color: "#f08a1c" },
  { id: "wave", title: "WAVE", color: "#4b5bd7" },
  { id: "gpt", title: "GPT", color: "#1c1c24" },
  { id: "sheets", title: "Google Sheets", color: "#1e8e3e" },
  { id: "s3", title: "AWS S3", color: "#ff5a47" },
];
const LINKS = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [4, 5],
];
// Position de départ (coin haut gauche) en % du cadre
const WIDE = { cron: [2, 40], lh: [22, 14], wave: [22, 66], gpt: [42, 40], sheets: [62, 40], s3: [82, 40] };
const NARROW = { cron: [5, 2], lh: [52, 16], wave: [5, 31], gpt: [52, 45], sheets: [5, 60], s3: [52, 76] };
const MQ = "(max-width: 760px)";
const SVG_NS = "http://www.w3.org/2000/svg";
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const idle = () => Object.fromEntries(NODES.map((n) => [n.id, { state: "idle", value: "" }]));

export default function SeoEditor() {
  const { t } = useTranslation();
  const frameRef = useRef(null);
  const nodeEls = useRef([]);
  const pathEls = useRef([]);
  const packetsG = useRef(null);
  const frac = useRef(null); // positions des nœuds, en fraction du cadre
  const packets = useRef([]);
  const raf = useRef(0);
  const timeline = useRef(null);
  const visible = useRef(true);
  const [status, setStatus] = useState("idle"); // idle | run | done
  const [nodes, setNodes] = useState(idle);
  const reduced = prefersReducedMotion();

  const setNode = useCallback((id, state, value = "") => setNodes((prev) => ({ ...prev, [id]: { state, value } })), []);

  // Fils : un trait entre les deux nœuds, du bord droit au bord gauche (ou de bas en haut si les nœuds sont l'un sur l'autre)
  const recalc = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const c = frame.getBoundingClientRect();
    LINKS.forEach(([a, b], i) => {
      const A = nodeEls.current[a];
      const B = nodeEls.current[b];
      const path = pathEls.current[i];
      if (!A || !B || !path) return;
      const ra = A.getBoundingClientRect();
      const rb = B.getBoundingClientRect();
      let x1;
      let y1;
      let x2;
      let y2;
      let d;
      if (rb.left > ra.right - 12) {
        x1 = ra.right - c.left;
        y1 = ra.top + ra.height / 2 - c.top;
        x2 = rb.left - c.left;
        y2 = rb.top + rb.height / 2 - c.top;
        const dx = Math.max(50, Math.abs(x2 - x1) * 0.45);
        d = `M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}`;
      } else {
        const down = rb.top > ra.top;
        x1 = ra.left + ra.width / 2 - c.left;
        y1 = (down ? ra.bottom : ra.top) - c.top;
        x2 = rb.left + rb.width / 2 - c.left;
        y2 = (down ? rb.top : rb.bottom) - c.top;
        const dy = Math.max(40, Math.abs(y2 - y1) * 0.45) * (down ? 1 : -1);
        d = `M${x1} ${y1} C${x1} ${y1 + dy},${x2} ${y2 - dy},${x2} ${y2}`;
      }
      path.setAttribute("d", d);
    });
  }, []);

  const place = useCallback(() => {
    nodeEls.current.forEach((el, i) => {
      if (!el) return;
      const f = frac.current[NODES[i].id];
      el.style.left = `${(f[0]).toFixed(2)}%`;
      el.style.top = `${(f[1]).toFixed(2)}%`;
    });
    recalc();
  }, [recalc]);

  // Dispositions de départ selon la largeur ; les nœuds déplacés à la main restent où on les a mis
  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const layout = () => {
      frac.current = Object.fromEntries(Object.entries(mq.matches ? NARROW : WIDE).map(([k, v]) => [k, [...v]]));
      place();
    };
    layout();
    mq.addEventListener("change", layout);
    const ro = new ResizeObserver(recalc);
    ro.observe(frameRef.current);
    return () => {
      mq.removeEventListener("change", layout);
      ro.disconnect();
    };
  }, [place, recalc]);

  // Paquets : un point qui suit le tracé d'un fil
  const frame = useCallback(() => {
    raf.current = 0;
    const now = performance.now();
    packets.current = packets.current.filter((p) => {
      const u = (now - p.t0) / p.dur;
      if (u >= 1) {
        p.el.remove();
        return false;
      }
      const pt = p.path.getPointAtLength(ease(u) * p.len);
      p.el.setAttribute("cx", pt.x.toFixed(1));
      p.el.setAttribute("cy", pt.y.toFixed(1));
      p.el.style.opacity = String(Math.min(1, u * 8, (1 - u) * 8) * p.alpha);
      return true;
    });
    if (packets.current.length) raf.current = requestAnimationFrame(frame);
  }, []);
  const spawn = useCallback(
    (link, alpha = 1) => {
      const path = pathEls.current[link];
      const g = packetsG.current;
      if (reduced || !path || !g || !path.getAttribute("d")) return;
      const el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("r", alpha < 1 ? "4" : "6");
      el.setAttribute("class", "seo-packet");
      g.appendChild(el);
      packets.current.push({ el, path, len: path.getTotalLength(), t0: performance.now(), dur: 950, alpha });
      if (!raf.current) raf.current = requestAnimationFrame(frame);
    },
    [frame, reduced]
  );

  // Au repos, de temps en temps, une impulsion court sur un fil (l'éditeur est vivant) ; seulement à l'écran
  useEffect(() => {
    if (reduced) return undefined;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
    });
    io.observe(frameRef.current);
    const id = setInterval(() => {
      if (visible.current && !document.hidden && !timeline.current) spawn(Math.floor(Math.random() * LINKS.length), 0.55);
    }, 2600);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, [spawn, reduced]);

  useEffect(
    () => () => {
      if (timeline.current) timeline.current.kill();
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    []
  );

  // Déplacement d'un nœud : souris, doigt (pointer events) ou flèches
  const onPointerDown = (e, i) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = nodeEls.current[i];
    const fr = frameRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-drag");
    const move = (ev) => {
      const w = fr.width;
      const h = fr.height;
      const x = clamp(((ev.clientX - dx - fr.left) / w) * 100, 0, 100 - (r.width / w) * 100);
      const y = clamp(((ev.clientY - dy - fr.top) / h) * 100, 0, 100 - (r.height / h) * 100);
      frac.current[NODES[i].id] = [x, y];
      place();
    };
    const up = () => {
      el.classList.remove("is-drag");
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };
  const onKeyDown = (e, i) => {
    const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }[e.key];
    if (!step) return;
    e.preventDefault();
    const f = frac.current[NODES[i].id];
    f[0] = clamp(f[0] + step[0], 0, 84);
    f[1] = clamp(f[1] + step[1], 0, 84);
    place();
  };

  // « Exécuter » : le pipeline joue étape par étape, un paquet suit chaque fil à son tour
  const run = () => {
    if (status === "run") return;
    if (timeline.current) timeline.current.kill();
    setNodes(idle());
    setStatus("run");
    const V = {
      cron: "02:00 ✓",
      lh: t("Worlds.seo.v.lh"),
      wave: t("Worlds.seo.v.wave"),
      gpt: t("Worlds.seo.v.gpt"),
      sheets: t("Worlds.seo.v.sheets"),
      s3: "rapport.json ✓",
    };
    const done = (id) => setNode(id, "done", V[id]);
    if (reduced) {
      NODES.forEach((n) => done(n.id));
      setStatus("done");
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        timeline.current = null;
        setStatus("done");
      },
    });
    timeline.current = tl;
    tl.call(() => setNode("cron", "run"), null, 0)
      .call(() => {
        done("cron");
        spawn(0);
        spawn(1);
      }, null, 0.5)
      .call(() => {
        setNode("lh", "run");
        setNode("wave", "run");
      }, null, 1.4)
      .call(() => {
        done("lh");
        done("wave");
        spawn(2);
        spawn(3);
      }, null, 3.3)
      .call(() => setNode("gpt", "run"), null, 4.3)
      .call(() => {
        done("gpt");
        spawn(4);
      }, null, 5.5)
      .call(() => setNode("sheets", "run"), null, 6.5)
      .call(() => {
        done("sheets");
        spawn(5);
      }, null, 7.2)
      .call(() => setNode("s3", "run"), null, 8.2)
      .call(() => done("s3"), null, 8.9)
      .to({}, { duration: 0.4 }, 8.9);
  };

  const subs = { cron: "cron", lh: "lh", wave: "wave", gpt: "gpt", sheets: "sheets", s3: "s3" };

  return (
    <div className="seo-ed">
      <div className="seo-ed__bar">
        <p className="seo-ed__file mono" aria-hidden="true">
          {t("Worlds.seo.file")}
        </p>
        <p className="seo-ed__hint mono">{t("Worlds.seo.hint")}</p>
        <button type="button" className="seo-ed__run" onClick={run} disabled={status === "run"} data-cursor="view">
          <span aria-hidden="true">{status === "run" ? "●" : "▶"}</span>
          {status === "run" ? t("Worlds.seo.running") : status === "done" ? t("Worlds.seo.replay") : t("Worlds.seo.run")}
        </button>
      </div>

      <div className="seo-ed__frame" ref={frameRef}>
        <svg className="seo-ed__wires" aria-hidden="true" focusable="false">
          {LINKS.map((l, i) => (
            <path key={i} ref={(el) => (pathEls.current[i] = el)} fill="none" />
          ))}
          <g ref={packetsG} />
        </svg>
        {NODES.map((n, i) => (
          <div
            key={n.id}
            ref={(el) => (nodeEls.current[i] = el)}
            className={`seo-node is-${nodes[n.id].state}`}
            style={{ "--c": n.color }}
            tabIndex={0}
            role="group"
            aria-label={`${n.title} : ${t(`Worlds.seo.sub.${subs[n.id]}`)}`}
            onPointerDown={(e) => onPointerDown(e, i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <header>
              <i />
              {n.title}
            </header>
            <p>{t(`Worlds.seo.sub.${subs[n.id]}`)}</p>
            <b>{nodes[n.id].value || "—"}</b>
            <span className="seo-node__bar" aria-hidden="true">
              <i />
            </span>
          </div>
        ))}
      </div>

      <div className="seo-ed__report" aria-live="polite" data-open={status === "done"}>
        {status === "done" && (
          <>
            <p className="seo-ed__report-head mono">{t("Worlds.seo.report.head")}</p>
            <ul>
              {[1, 2, 3].map((k) => (
                <li key={k}>
                  <span className="mono">{t(`Worlds.seo.report.c${k}.cat`)}</span>
                  <b>{t(`Worlds.seo.report.c${k}.title`)}</b>
                  <p>{t(`Worlds.seo.report.c${k}.text`)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
