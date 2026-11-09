import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { hasFinePointer } from "../../Effects/motion";
import { useWorldFonts } from "../shared/SceneHero";
import "../shared/videoHero.css";

// W1 · du plan à la maquette. Le plan d'architecte (lignes turquoise sur fond anthracite) se lit à plat, puis, au
// défilement épinglé, les murs montent, le sol se teinte, le mobilier se pose et la caméra bascule de la vue de dessus à une
// vue trois quarts. Les arêtes turquoise restent visibles : on garde le dessin dans la 3D. Géométrie simple (boîtes).
const ROOMS = [
  { name: "Séjour", x: 0, z: 0, w: 6.2, d: 4.4, floor: 0x2b2e31 },
  { name: "Cuisine", x: 6.2, z: 0, w: 3.8, d: 2.6, floor: 0x3a342c },
  { name: "Chambre", x: 6.2, z: 2.6, w: 3.8, d: 3.8, floor: 0x2b2e31 },
  { name: "Salle de bain", x: 0, z: 4.4, w: 3.2, d: 2, floor: 0x24373a },
  { name: "Entrée", x: 3.2, z: 4.4, w: 3, d: 2, floor: 0x2b2e31 },
];
// Mobilier : x, z (centre), largeur, profondeur, hauteur, couleur
const FURNITURE = [
  [1.8, 1.0, 2.6, 0.9, 0.45, 0x1fb8c4],
  [1.8, 2.2, 1.2, 0.7, 0.3, 0xf2b97a],
  [8.4, 4.8, 2.0, 1.8, 0.5, 0xe8e8e6],
  [7.6, 0.5, 2.6, 0.6, 0.9, 0xf2b97a],
  [1.2, 5.6, 1.5, 0.7, 0.5, 0xbfd8dc],
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function PlanHero({ palette, fonts, title, tagline, crumb, facts, media, hint, scroll = 2.2 }) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const labelsRef = useRef([]);
  useWorldFonts(fonts);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    if (!root || !pin || !canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x232527, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hasFinePointer() ? 2 : 1.5));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x232527);
    const cam = new THREE.PerspectiveCamera(34, 1.7, 0.1, 100);
    const group = new THREE.Group();
    group.position.set(-5, 0, -3.2);
    scene.add(group);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303438, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.8);
    sun.position.set(8, 12, 6);
    scene.add(sun);

    const grid = new THREE.GridHelper(40, 40, 0x1fb8c4, 0x1fb8c4);
    grid.material.transparent = true;
    grid.material.opacity = 0.07;
    grid.position.set(5, -0.01, 3.2);
    group.add(grid);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e6, roughness: 0.8 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1fb8c4, toneMapped: false });
    const walls = [];
    const addWall = (x1, z1, x2, z2, delay) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const box = new THREE.BoxGeometry(len + 0.14, 1, 0.14);
      box.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(box, wallMat);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), lineMat);
      const holder = new THREE.Group();
      holder.add(mesh, edges);
      holder.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
      holder.rotation.y = Math.atan2(z1 - z2, x2 - x1);
      group.add(holder);
      walls.push({ holder, delay, mesh });
    };
    let k = 0;
    const floors = ROOMS.map((r) => {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(r.w, r.d),
        new THREE.MeshStandardMaterial({ color: r.floor, roughness: 0.9, transparent: true, opacity: 0 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(r.x + r.w / 2, 0.005, r.z + r.d / 2);
      group.add(floor);
      [
        [r.x, r.z, r.x + r.w, r.z],
        [r.x + r.w, r.z, r.x + r.w, r.z + r.d],
        [r.x + r.w, r.z + r.d, r.x, r.z + r.d],
        [r.x, r.z + r.d, r.x, r.z],
      ].forEach((w) => addWall(...w, (k += 1) * 0.04));
      return floor;
    });
    const furniture = FURNITURE.map(([x, z, w, d, h, color]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
      m.position.set(x, h / 2, z);
      group.add(m);
      return m;
    });

    const v = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    const top = new THREE.Vector3(0, 19, 0.01);
    const side = new THREE.Vector3(9, 8.5, 12.5);
    const pointer = { u: 0.5, v: 0.5, tu: 0.5, tv: 0.5 };
    let W = 1;
    let H = 1;
    let fit = 1;
    const measure = () => {
      const r = pin.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      renderer.setSize(W, H, false);
      cam.aspect = W / H;
      cam.updateProjectionMatrix();
      // portrait : on recule pour que tout le plan tienne ; écran large : la maquette se décale vers la droite (le titre est à gauche)
      fit = (cam.aspect < 1.5 ? Math.pow(1.5 / cam.aspect, 0.85) : 1) * 1.12;
      group.position.x = -5 + (cam.aspect > 1.3 ? 2.6 : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);
    const onMove = (e) => {
      const r = pin.getBoundingClientRect();
      pointer.tu = clamp((e.clientX - r.left) / r.width);
      pointer.tv = clamp(1 - (e.clientY - r.top) / r.height);
    };
    root.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let visible = true;
    let t0 = 0;
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const r = root.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - H));
      pointer.u += (pointer.tu - pointer.u) * 0.06;
      pointer.v += (pointer.tv - pointer.v) * 0.06;

      const lift = smooth(0.2, 0.62, p);
      walls.forEach((w) => {
        const e = clamp((lift - w.delay * 0.7) / (1 - 0.7 * 0.5));
        w.holder.scale.y = 0.005 + Math.pow(e, 1.4) * 1.3;
        w.mesh.visible = e > 0.01;
      });
      const fur = smooth(0.62, 0.8, p);
      furniture.forEach((m, i) => {
        const e = clamp(fur * 1.6 - i * 0.12);
        m.visible = e > 0.01;
        m.scale.y = Math.max(e, 0.001);
        m.position.y = 0.25 * e;
      });
      floors.forEach((f) => {
        f.material.opacity = smooth(0.32, 0.6, p);
      });
      const c = smooth(0.14, 0.86, p);
      camPos.copy(top).lerp(side, c).multiplyScalar(fit);
      camPos.x += (pointer.u - 0.5) * 1.6 * c;
      camPos.y += (pointer.v - 0.5) * 1.2 * c;
      cam.position.copy(camPos);
      cam.lookAt(group.position.x + 5, 0.3 * c, 0);
      cam.updateMatrixWorld();
      ROOMS.forEach((room, i) => {
        const el = labelsRef.current[i];
        if (!el) return;
        v.set(room.x + room.w / 2 - 5 + (group.position.x + 5), lift * 1.5 + 0.1, room.z + room.d / 2 - 3.2).project(cam);
        el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px)`;
      });
      grid.material.opacity = 0.07 + Math.sin(t * 0.8) * 0.01;
      renderer.render(scene, cam);
      root.classList.add("is-live");
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) run();
      },
      { threshold: 0 }
    );
    io.observe(root);
    const onVis = () => run();
    document.addEventListener("visibilitychange", onVis);
    run();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  const vars = { "--len": 1 + scroll };
  palette.forEach((color, i) => {
    vars[`--w${i}`] = color;
  });

  return (
    <header className="vh-root w-ba-immobilier-video" data-work-top style={vars}>
      <div className="vh vh--plan" ref={rootRef}>
        <div className="vh__pin" ref={pinRef}>
          <canvas className="vh__canvas" ref={canvasRef} aria-hidden="true" />
          {ROOMS.map((r, i) => (
            <span className="vh__room mono" key={r.name} ref={(el) => (labelsRef.current[i] = el)} aria-hidden="true">
              {r.name}
            </span>
          ))}
          <div className="vh__crumb container">{crumb}</div>
          <div className="vh__copy container">
            <h1 className="vh__title">{title}</h1>
            <p className="vh__tagline">{tagline}</p>
            {hint && <p className="vh__hint mono">{hint}</p>}
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
