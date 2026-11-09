import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";
import { setCursorHint } from "./cursorBus";

// P1 : le nom tombe dans le pied de page. Chaque lettre de ARTHUR BRU est un corps rigide (Matter.js, chargé à
// l'approche du pied de page) ; elles tombent quand il entre à l'écran, rebondissent, s'empilent, et se prennent à la
// souris. Le grand nom HTML (décoratif, aria-hidden) reste la version fixe : mouvement réduit, tactile sans physique,
// JS absent. Dès que la chute démarre il s'efface (classe footer--drop) et les lettres du canvas prennent sa place.

const NAME = "ARTHURBRU";
const VIOLET_FROM = 6; // « BRU » prend la teinte d'accent

export function useFooterDrop(rootRef, giantRef, label = "") {
  const labelRef = useRef(label);
  labelRef.current = label;
  useEffect(() => {
    const root = rootRef.current;
    const giant = giantRef.current;
    if (!root || !giant || prefersReducedMotion()) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    let disposed = false;
    let started = false;
    let visible = false;
    let M = null; // module Matter
    let canvas = null;
    let ctx = null;
    let engine = null;
    let letters = [];
    let mouse = null;
    let mc = null;
    let raf = 0;
    let last = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let fontFamily = "sans-serif";
    let ink = "#f3f0ea";
    let accent = "#bc63ff";
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups = [];

    const readTheme = () => {
      const cs = getComputedStyle(root);
      fontFamily = getComputedStyle(giant).fontFamily || fontFamily;
      ink = cs.getPropertyValue("--ink").trim() || ink;
      accent = cs.getPropertyValue("--violet").trim() || accent;
    };

    const build = () => {
      const { Bodies, Composite, Body } = M;
      Composite.clear(engine.world, false);
      const t = 80;
      const walls = [
        // Le sol est au-dessus de la barre du HUD et de son dégradé (≈ 90 px) : les lettres empilées restent lisibles
        Bodies.rectangle(W / 2, H + t / 2 - 90, W + 400, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true }),
      ];
      Composite.add(engine.world, walls);
      const size = Math.min(W / 6.8, 340);
      ctx.font = `800 ${size}px ${fontFamily}`;
      try {
        ctx.fontStretch = "semi-condensed";
      } catch (e) {
        /* navigateur sans fontStretch : sans gravité */
      }
      letters = [...NAME].map((ch, i) => {
        const w = ctx.measureText(ch).width * 0.96;
        const h = size * 0.74;
        const body = Bodies.rectangle(
          W * (0.1 + (i / (NAME.length - 1)) * 0.8),
          -h - i * 150 - Math.random() * 80,
          w,
          h,
          { restitution: 0.32, friction: 0.6, density: 0.0016, chamfer: { radius: 6 }, angle: (Math.random() - 0.5) * 0.7 }
        );
        Body.setVelocity(body, { x: 0, y: 2 });
        return { ch, body, size, color: i >= VIOLET_FROM ? accent : ink };
      });
      Composite.add(engine.world, letters.map((l) => l.body));
      if (fine && mc) Composite.add(engine.world, mc);
    };

    const measure = () => {
      const r = root.getBoundingClientRect();
      W = Math.round(r.width);
      H = Math.round(r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const l of letters) {
        ctx.save();
        ctx.translate(l.body.position.x, l.body.position.y);
        ctx.rotate(l.body.angle);
        ctx.font = `800 ${l.size}px ${fontFamily}`;
        try {
          ctx.fontStretch = "semi-condensed";
        } catch (e) {
          /* idem */
        }
        ctx.fillStyle = l.color;
        ctx.fillText(l.ch, 0, l.size * 0.04);
        ctx.restore();
      }
    };

    const tick = (now) => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      const dt = Math.min(33, now - (last || now));
      last = now;
      M.Engine.update(engine, Math.min(16.6, dt) || 16.6);
      draw();
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf && started && visible) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const start = async () => {
      if (started || disposed || !M) return;
      started = true;
      try {
        await document.fonts.load(`800 64px ${fontFamily}`);
      } catch (e) {
        /* la police de secours convient */
      }
      if (disposed) return;
      readTheme();
      canvas = document.createElement("canvas");
      canvas.className = "footer__drop";
      canvas.setAttribute("aria-hidden", "true");
      root.appendChild(canvas);
      ctx = canvas.getContext("2d");
      measure();
      engine = M.Engine.create({ gravity: { x: 0, y: 1.25 } });
      if (fine) {
        mouse = M.Mouse.create(root);
        mouse.pixelRatio = 1;
        mc = M.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.16, damping: 0.1, render: { visible: false } } });
        const onDown = (e) => {
          if (e.button !== 0) return;
          const hit = M.Query.point(letters.map((l) => l.body), mouse.position);
          if (hit.length) e.preventDefault(); // pas de sélection de texte en attrapant une lettre
        };
        const onUp = (e) => mouse && mouse.mouseup && mouse.mouseup(e); // lâcher hors du pied de page
        // Découvrabilité : le curseur du site passe en « Attraper » au-dessus d'une lettre, et la souris qui passe vite
        // dessus la pousse (sans clic), pour que l'on comprenne qu'elles réagissent.
        let hinted = false;
        let px = 0;
        let py = 0;
        let pt = 0;
        const onMove = (e) => {
          if (!letters.length) return;
          const bodies = letters.map((l) => l.body);
          const hit = M.Query.point(bodies, mouse.position);
          const on = hit.length > 0 || !!(mc && mc.body);
          if (on !== hinted) {
            hinted = on;
            setCursorHint(on ? "drag" : null, labelRef.current);
          }
          const now = performance.now();
          const dtm = now - pt;
          if (hit.length && !(mc && mc.body) && pt && dtm > 0 && dtm < 80) {
            const clamp = (v) => Math.max(-3, Math.min(3, v));
            const vx = clamp((e.clientX - px) / dtm);
            const vy = clamp((e.clientY - py) / dtm);
            const b = hit[0];
            M.Body.applyForce(b, mouse.position, { x: vx * b.mass * 0.011, y: vy * b.mass * 0.011 });
          }
          px = e.clientX;
          py = e.clientY;
          pt = now;
        };
        const onLeave = () => {
          pt = 0;
          if (hinted) {
            hinted = false;
            setCursorHint(null);
          }
        };
        root.addEventListener("mousemove", onMove);
        root.addEventListener("mouseleave", onLeave);
        root.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        cleanups.push(() => {
          root.removeEventListener("mousedown", onDown);
          root.removeEventListener("mousemove", onMove);
          root.removeEventListener("mouseleave", onLeave);
          if (hinted) setCursorHint(null);
          window.removeEventListener("mouseup", onUp);
        });
      }
      build();
      root.classList.add("footer--drop");
      run();
    };

    // Matter se charge à l'approche (800 px), la chute démarre quand le pied de page est vraiment à l'écran
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || M) return;
        near.disconnect();
        import("matter-js").then((mod) => {
          if (disposed) return;
          M = mod.default || mod;
          if (visible) start();
        });
      },
      { rootMargin: "800px 0px" }
    );
    near.observe(root);

    const seen = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          if (!started) start();
          else run();
        }
      },
      { threshold: 0.25 }
    );
    seen.observe(root);

    const onResize = () => {
      if (!started || !canvas) return;
      measure();
      build();
    };
    window.addEventListener("resize", onResize);
    const onVis = () => run();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      disposed = true;
      near.disconnect();
      seen.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      cleanups.forEach((fn) => fn());
      if (raf) cancelAnimationFrame(raf);
      if (M && engine) {
        M.Composite.clear(engine.world, false);
        M.Engine.clear(engine);
        if (mouse) M.Mouse.clearSourceEvents(mouse);
      }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      root.classList.remove("footer--drop");
    };
  }, [rootRef, giantRef]);
}
