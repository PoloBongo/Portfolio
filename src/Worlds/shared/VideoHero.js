import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ClipTexture, setClipNow } from "../../Effects/stage3d/clipTexture";
import { hasFinePointer } from "../../Effects/motion";
import { clipPoster, clipSrc } from "../../Pages/clips";
import { PRELUDE, VERT } from "./videoHero.glsl";
import { useWorldFonts } from "./SceneHero";
import "./videoHero.css";

// Hero d'un monde sur vrai clip : tout l'écran est le clip du projet, un fragment shader (frag) traduit la mécanique du
// jeu. Le titre reste du vrai texte HTML par-dessus. Sans WebGL, en mouvement réduit ou avec économie de données, le
// monde garde sa scène décorative (voir Hero.js de chaque monde).
//  clip    : id du clip (public/clips/<id>.mp4)
//  frag    : main() du shader (prélude et uniforms communs : videoHero.glsl.js)
//  palette : [fond, accent, second, surface, encre]
//  hint    : phrase d'invite · lit : le titre n'est visible que dans le faisceau de la lampe
//  scroll  : nombre d'écrans de défilement épinglés ; le défilement devient uP (0 → 1), ex. la profondeur
//  uniforms: () => uniforms supplémentaires du shader
//  setup   : ({ root, uniforms }) => { frame({ t, p, dt }, uniforms), click(u, v, uniforms), dispose() }
export default function VideoHero({
  id,
  clip,
  frag,
  palette,
  fonts,
  title,
  tagline,
  crumb,
  facts,
  media,
  hint,
  lit = false,
  scroll = 0,
  uniforms: makeUniforms,
  setup,
  children,
}) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  useWorldFonts(fonts);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    if (!root || !pin || !canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x03050f, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hasFinePointer() ? 2 : 1.5));

    const video = document.createElement("video");
    video.src = clipSrc(clip);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    const tex = new ClipTexture(video);
    tex.colorSpace = THREE.NoColorSpace;

    const uniforms = {
      uTex: { value: tex },
      uVid: { value: 16 / 9 },
      uAsp: { value: 1.7 },
      uT: { value: 0 },
      uP: { value: 0 },
      uVel: { value: 0 },
      uM: { value: new THREE.Vector2(0.5, 0.5) },
      uRes: { value: new THREE.Vector2(1, 1) },
      ...(makeUniforms ? makeUniforms(THREE) : {}),
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: PRELUDE + frag,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.Camera();
    const extra = setup ? setup({ root: pin, uniforms }) || {} : {};

    // Pointeur : la lampe suit le curseur ou le doigt ; sans pointeur depuis 2,5 s, elle flâne seule (tactile, clavier,
    // visiteur immobile) et finit par passer sur le titre
    const target = { u: 0.5, v: 0.5 };
    let lastMove = -1e9;
    let W = 1;
    let H = 1;
    let titleX = 0;
    let titleY = 0;
    const measure = () => {
      const r = pin.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      renderer.setSize(W, H, false);
      uniforms.uAsp.value = W / H;
      uniforms.uRes.value.set(W * renderer.getPixelRatio(), H * renderer.getPixelRatio());
      const t = titleRef.current;
      if (t) {
        const tr = t.getBoundingClientRect();
        titleX = tr.left - r.left;
        titleY = tr.top - r.top;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);

    const toUV = (e) => {
      const r = pin.getBoundingClientRect();
      return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height))];
    };
    const onMove = (e) => {
      [target.u, target.v] = toUV(e);
      lastMove = performance.now();
    };
    const onClick = (e) => {
      if (!extra.click || (e.target.closest && e.target.closest("a, button"))) return;
      const [u, v] = toUV(e);
      extra.click(u, v, uniforms);
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerdown", onMove, { passive: true });
    root.addEventListener("click", onClick);

    video.addEventListener("loadedmetadata", () => {
      if (video.videoHeight) uniforms.uVid.value = video.videoWidth / video.videoHeight;
    });
    let live = false;
    const play = () => video.play().catch(() => {});

    let raf = 0;
    let visible = true;
    let t0 = 0;
    let prev = 0;
    let lastY = window.scrollY;
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (!t0) t0 = now;
      const dt = Math.min(0.05, (now - (prev || now)) / 1000);
      prev = now;
      const t = (now - t0) / 1000;
      if (now - lastMove > 2500) {
        target.u = 0.5 + 0.34 * Math.sin(t * 0.45);
        target.v = 0.42 + 0.2 * Math.sin(t * 0.7 + 1);
      }
      const k = 1 - Math.exp(-dt * 9);
      uniforms.uM.value.x += (target.u - uniforms.uM.value.x) * k;
      uniforms.uM.value.y += (target.v - uniforms.uM.value.y) * k;
      uniforms.uT.value = t;
      {
        // uP : le défilement épinglé du monde (0 en haut, 1 quand le cadre se détache) ; sans épinglage, la sortie du cadre
        const r = root.getBoundingClientRect();
        const range = Math.max(1, scroll ? r.height - H : H);
        uniforms.uP.value = Math.min(1, Math.max(0, -r.top / range));
        // uVel : vitesse de défilement lissée (la molette donne de la vitesse)
        const y = window.scrollY;
        const vel = Math.max(-2, Math.min(2, ((y - lastY) / Math.max(1, dt * 1000)) * 0.3));
        lastY = y;
        uniforms.uVel.value += (vel - uniforms.uVel.value) * (1 - Math.exp(-dt * 6));
      }
      if (extra.frame) extra.frame({ t, p: uniforms.uP.value, dt }, uniforms);
      setClipNow(now);
      renderer.render(scene, camera);
      if (!live && video.readyState >= 2) {
        live = true;
        root.classList.add("is-live");
      }
      if (lit) {
        const x = uniforms.uM.value.x * W - titleX;
        const y = (1 - uniforms.uM.value.y) * H - titleY;
        root.style.setProperty("--x", `${x.toFixed(1)}px`);
        root.style.setProperty("--y", `${y.toFixed(1)}px`);
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!raf && visible && !document.hidden) {
        prev = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          play();
          run();
        } else video.pause();
      },
      { threshold: 0 }
    );
    io.observe(root);
    const onVis = () => {
      if (document.hidden) video.pause();
      else {
        play();
        run();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    play();
    run();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onMove);
      root.removeEventListener("click", onClick);
      if (extra.dispose) extra.dispose();
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, frag, lit, scroll]);

  const vars = { "--len": scroll ? 1 + scroll : 1 };
  palette.forEach((color, i) => {
    vars[`--w${i}`] = color;
  });

  return (
    <header className={`vh-root w-${id}-video`} data-work-top style={vars}>
      <div className={`vh${lit ? " vh--lit" : ""}`} ref={rootRef} style={{ "--poster": `url(${clipPoster(clip)})` }}>
        <div className="vh__pin" ref={pinRef}>
          <div className="vh__poster" aria-hidden="true" />
          <canvas className="vh__canvas" ref={canvasRef} aria-hidden="true" />
          <div className="vh__crumb container">{crumb}</div>
          <div className="vh__copy container">
            <h1 className="vh__title" ref={titleRef}>
              {title}
            </h1>
            <p className="vh__tagline">{tagline}</p>
            {hint && <p className="vh__hint mono">{hint}</p>}
            {children}
          </div>
        </div>
      </div>
      <div className="container">{facts}</div>
      <div className="container work-stage">
        <div className="case__media">{media}</div>
      </div>
    </header>
  );
}
