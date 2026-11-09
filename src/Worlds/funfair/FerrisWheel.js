import React, { useEffect, useRef } from "react";
import { prefersReducedMotion, hasFinePointer } from "../../Effects/motion";
import "../shared/videoHero.css";
import "./ferris-wheel.css";

// Cover du monde Funfair : la grande roue du jeu, en vrai modèle 3D : la structure, le portique et l'étoile du moyeu (wheel.glb) et une cabine (cabin.glb)
// instanciée 24 fois autour de la jante. Les modèles viennent du projet Unreal (Funfair_UE5) : exportés avec l'éditeur, textures
// recuites en WebP (couleurs de peinture appliquées via les masques), maillages simplifiés et compressés Meshopt. La roue tourne
// au défilement, les cabines restent à l'horizontale (elles pendent) et chacune a sa couleur de peinture (cinq variantes du jeu).
// La roue tourne au défilement (la cover s'épingle), une image fixe en mouvement réduit. Le hero choisit la scène décorative sans WebGL 2.
const BASE = `${process.env.PUBLIC_URL || ""}/models/funfair`;
const HUB = 21.691; // hauteur du moyeu (m)
const RIM = 17.6; // rayon où pivotent les cabines (m)
const COUNT = 24;
const reducedStatic = () => prefersReducedMotion();
// Couleurs de peinture des cinq cabines du jeu (MI_FairyCabin01 à 05, linéaire)
const PAINTS = [
  [0.182, 0.182, 0.182],
  [0.0, 0.573, 0.745],
  [0.906, 0.704, 0.0],
  [0.512, 0.099, 1.0],
  [1.0, 0.031, 0.0],
];

export default function FerrisWheel({ id = "funfair", palette, title, tagline, crumb, facts, media }) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const host = hostRef.current;
    if (!root || !pin || !host) return undefined;
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl2")) return undefined;
    } catch (e) {
      return undefined;
    }

    let disposed = false;
    let stop = () => {};
    const start = async () => {
      const [THREE, { GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/libs/meshopt_decoder.module.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;
      const reduced = prefersReducedMotion();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hasFinePointer() ? 1.75 : 1.4));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.55;
      const key = new THREE.DirectionalLight(0xffd9a8, 1.6);
      key.position.set(30, 40, 30);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x6f8cff, 0.7);
      rim.position.set(-30, 20, -20);
      scene.add(rim);

      const cam = new THREE.PerspectiveCamera(30, 1.6, 1, 400);
      const target = new THREE.Vector3(0, 19, 0);

      // ombre au sol : un disque doux sous la roue
      const shadowTex = (() => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 128;
        const g = cv.getContext("2d");
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, "rgba(0,0,0,0.55)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
        const tx = new THREE.CanvasTexture(cv);
        tx.colorSpace = THREE.SRGBColorSpace;
        return tx;
      })();
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(46, 22), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      scene.add(shadow);

      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const [wheelGltf, cabinGltf] = await Promise.all([loader.loadAsync(`${BASE}/wheel.glb`), loader.loadAsync(`${BASE}/cabin.glb`)]);
      if (disposed) {
        renderer.dispose();
        return;
      }

      // la roue : le portique (« frame ») reste fixe ; la structure (« wheel ») et l'étoile (« star ») ont leur origine au moyeu
      // et tournent autour de l'axe Z
      const wheelRoot = wheelGltf.scene;
      scene.add(wheelRoot);
      const spinNodes = ["wheel", "star"].map((n) => wheelRoot.getObjectByName(n)).filter(Boolean);

      // cabine : un seul maillage, 24 instances, couleur de peinture par instance (teinte seulement la zone peinte, masque en alpha)
      let cabinMesh = null;
      cabinGltf.scene.traverse((o) => {
        if (o.isMesh && !cabinMesh) cabinMesh = o;
      });
      const mat = cabinMesh.material;
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "").replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
            vec4 sampledDiffuseColor = texture2D( map, vMapUv );
            diffuseColor.rgb *= sampledDiffuseColor.rgb * mix( vec3( 1.0 ), vColor.rgb, sampledDiffuseColor.a );
          #endif`
        );
      };
      const cabins = new THREE.InstancedMesh(cabinMesh.geometry, mat, COUNT);
      const col = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        const p = PAINTS[i % PAINTS.length];
        col.setRGB(p[0], p[1], p[2], THREE.LinearSRGBColorSpace);
        cabins.setColorAt(i, col);
      }
      cabins.instanceColor.needsUpdate = true;
      scene.add(cabins);

      const m4 = new THREE.Matrix4();
      const place = (angle) => {
        for (let i = 0; i < COUNT; i++) {
          const a = angle + (i / COUNT) * Math.PI * 2;
          m4.makeTranslation(Math.cos(a) * RIM, HUB + Math.sin(a) * RIM, 0);
          cabins.setMatrixAt(i, m4);
        }
        cabins.instanceMatrix.needsUpdate = true;
        spinNodes.forEach((n) => {
          n.rotation.z = angle;
        });
      };

      let W = 1;
      let H = 1;
      const measure = () => {
        const r = pin.getBoundingClientRect();
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));
        renderer.setSize(W, H, false);
        cam.aspect = W / H;
        // portrait : on recule pour garder toute la roue
        const dist = 98 * Math.max(1, 1.45 / cam.aspect);
        // grand écran : la roue passe à droite, le texte reste à gauche
        target.set(cam.aspect > 1.3 ? -11 : 0, 19, 0);
        cam.position.set(dist * 0.42, 17 + dist * 0.1, dist * 0.9);
        cam.lookAt(target);
        cam.updateProjectionMatrix();
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(pin);

      const pointer = { u: 0.5, tu: 0.5 };
      const onMove = (e) => {
        const r = pin.getBoundingClientRect();
        pointer.tu = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      };
      pin.addEventListener("pointermove", onMove, { passive: true });

      let raf = 0;
      let visible = true;
      let t0 = 0;
      const frame = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        if (!t0) t0 = now;
        const rr = root.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -rr.top / Math.max(1, rr.height - H)));
        const angle = reduced ? 0.4 : p * Math.PI * 1.4 + ((now - t0) / 1000) * 0.06;
        place(angle);
        pointer.u += (pointer.tu - pointer.u) * 0.05;
        const swing = (pointer.u - 0.5) * 0.5;
        const dist = Math.hypot(cam.position.x, cam.position.z);
        const base = Math.atan2(0.42, 0.9);
        cam.position.x = Math.sin(base + swing) * dist;
        cam.position.z = Math.cos(base + swing) * dist;
        cam.lookAt(target);
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
      document.addEventListener("visibilitychange", run);
      run();

      stop = () => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        pin.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", run);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            [].concat(o.material).forEach((m) => {
              Object.values(m).forEach((v) => v && v.isTexture && v.dispose());
              m.dispose();
            });
          }
        });
        shadowTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    };

    start().catch(() => {});
    return () => {
      disposed = true;
      stop();
    };
  }, []);

  const vars = { "--len": reducedStatic() ? 1 : 2.4 };
  (palette || []).forEach((color, k) => {
    vars[`--w${k}`] = color;
  });

  return (
    <header className={`vh-root w-${id}-video`} data-work-top style={vars}>
      <div className="vh fw" ref={rootRef}>
        <div className="vh__pin" ref={pinRef}>
          <div className="fw__gl" ref={hostRef} />
          <div className="vh__crumb container">{crumb}</div>
          <div className="vh__copy container">
            <h1 className="vh__title">{title}</h1>
            <p className="vh__tagline">{tagline}</p>
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
