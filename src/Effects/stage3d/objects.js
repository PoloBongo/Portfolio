import * as THREE from "three";

// Deux objets 3D construits à la main (rien de téléchargé), dans l'esprit de la vue éclatée de la manette :
//  - la page web : cinq plaques de verre (fond, mise en page, composants, typographie, interaction) et un curseur ;
//  - l'attention : les mots de « Quelle est la marge du T3 ? », trois têtes d'attention en arcs dont l'épaisseur est
//    le poids, et la matrice d'attention en relief.
// Chaque objet est un groupe de pièces (`parts`) qui s'écartent et se recomposent : assemble(parts, u), u = 0 → éparpillé,
// u = 1 → assemblé. C'est le « désassemblage » du passage d'un acte à l'autre.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Hasard déterministe : les pièces s'éparpillent de la même façon à chaque visite
const rnd = (() => {
  let s = 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
})();

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export function makeParts() {
  const group = new THREE.Group();
  group.userData.parts = [];
  return group;
}

function addPart(group, object, { dir, dist = 3.2, delay, spin = 7 } = {}) {
  group.add(object);
  const d = dir ? dir.clone() : object.position.clone();
  if (d.lengthSq() < 1e-4) d.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.2);
  d.normalize().multiplyScalar(dist * (0.7 + 0.7 * rnd()));
  group.userData.parts.push({
    m: object,
    p0: object.position.clone(),
    q0: object.quaternion.clone(),
    s0: object.scale.clone(),
    dir: d,
    delay: delay !== undefined ? delay : rnd() * 0.38,
    spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(spin),
  });
}

export function assemble(group, u) {
  for (const o of group.userData.parts) {
    const l = clamp((u - o.delay) / (1 - o.delay));
    const e = l * l * (3 - 2 * l);
    const k = 1 - e;
    o.m.visible = l > 0.002;
    o.m.position.copy(o.p0).addScaledVector(o.dir, k * k);
    o.m.scale.copy(o.s0).multiplyScalar(Math.max(e, 0.0001));
    tmpE.set(o.spin.x * k, o.spin.y * k, o.spin.z * k);
    o.m.quaternion.copy(o.q0).multiply(tmpQ.setFromEuler(tmpE));
  }
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Une impulsion lumineuse court sur chaque tube, à la vitesse et au décalage voulus
function pulseMaterial(timeUniform, color, speed, seed) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uColor: { value: new THREE.Vector3(...color) },
      uSpeed: { value: speed },
      uSeed: { value: seed },
    },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uTime; uniform float uSpeed; uniform float uSeed; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float d = fract(vUv.x - uTime * uSpeed - uSeed);
        float pulse = exp(-d * 9.0) * step(d, 0.7);
        gl_FragColor = vec4(uColor * (0.5 + pulse * 2.2), 0.42 + 0.5 * pulse);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';
const DISPLAY = '"Bricolage Grotesque Variable", system-ui, sans-serif';

/* ---------- Acte Web : une page vue éclatée ---------- */
const LIME = "217,255,74";

function drawLayer(kind, ctx, W, H) {
  const rr = (X, Y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(X + r, Y);
    ctx.arcTo(X + w, Y, X + w, Y + h, r);
    ctx.arcTo(X + w, Y + h, X, Y + h, r);
    ctx.arcTo(X, Y + h, X, Y, r);
    ctx.arcTo(X, Y, X + w, Y, r);
    ctx.closePath();
  };
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  rr(0, 0, W, H, 40);
  ctx.clip();
  ctx.font = `500 22px ${MONO}`;
  ctx.textBaseline = "top";
  if (kind === 0) {
    ctx.fillStyle = "rgba(8,12,18,0.92)";
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x <= W; x += 48) {
      ctx.strokeStyle = `rgba(${LIME},${x % 192 ? 0.1 : 0.26})`;
      ctx.lineWidth = x % 192 ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 48) {
      ctx.strokeStyle = `rgba(${LIME},${y % 192 ? 0.1 : 0.26})`;
      ctx.lineWidth = y % 192 ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(${LIME},0.75)`;
    ctx.fillText("GRILLE · 12 COLONNES", 44, H - 52);
  } else if (kind === 1) {
    ctx.fillStyle = "rgba(10,14,20,0.35)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(${LIME},0.9)`;
    ctx.lineWidth = 3;
    const boxes = [
      [48, 40, 1056, 84, "1056 × 84"],
      [48, 150, 640, 300, "640 × 300"],
      [712, 150, 392, 300, "392 × 300"],
      [48, 480, 336, 190, ""],
      [408, 480, 336, 190, ""],
      [768, 480, 336, 190, ""],
    ];
    for (const b of boxes) {
      ctx.setLineDash(b[4] ? [] : [14, 10]);
      rr(b[0], b[1], b[2], b[3], 14);
      ctx.stroke();
      if (b[4]) {
        ctx.fillStyle = `rgba(${LIME},0.9)`;
        ctx.fillText(b[4], b[0] + 16, b[1] + b[3] - 36);
      }
    }
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${LIME},0.7)`;
    ctx.fillText("MISE EN PAGE", 48, 8);
  } else if (kind === 2) {
    const card = (x, y, w, h, c1, c2) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      rr(x, y, w, h, 18);
      ctx.fill();
    };
    card(48, 150, 640, 300, "#d9ff4a", "#14b8a6");
    card(712, 150, 392, 300, "#7c3aed", "#ff5fa8");
    [48, 408, 768].forEach((x) => card(x, 480, 336, 190, "#1f2937", "#374151"));
    ctx.fillStyle = "#0a0a0f";
    rr(84, 380, 190, 52, 26);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    rr(300, 392, 78, 30, 15);
    ctx.fill();
    ctx.fillStyle = "#0a0a0f";
    ctx.beginPath();
    ctx.arc(358, 407, 11, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    rr(48, 40, 1056, 84, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(94 + i * 40, 82, 11, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 3; i++) {
      rr(760 + i * 120, 70, 90, 24, 12);
      ctx.fill();
    }
  } else if (kind === 3) {
    ctx.fillStyle = "#f3f0ea";
    ctx.font = `700 104px ${DISPLAY}`;
    ctx.fillText("Interfaces", 84, 176);
    ctx.fillText("rapides.", 84, 276);
    ctx.fillStyle = "rgba(243,240,234,0.55)";
    for (let i = 0; i < 3; i++) {
      rr(84, 380 + i * 22, 440 - i * 70, 10, 5);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(10,10,15,0.85)";
    rr(740, 180, 330, 230, 14);
    ctx.fill();
    ctx.font = `500 21px ${MONO}`;
    ctx.fillStyle = "#ff5fa8";
    ctx.fillText("const", 762, 200);
    ctx.fillStyle = "#d9ff4a";
    ctx.fillText(" Hero", 828, 200);
    ctx.fillStyle = "#a3a1b0";
    ctx.fillText("() => (", 762, 238);
    ctx.fillStyle = "#63e6be";
    ctx.fillText("  <Title />", 762, 276);
    ctx.fillText("  <Cards />", 762, 314);
    ctx.fillStyle = "#a3a1b0";
    ctx.fillText(")", 762, 352);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(243,240,234,0.5)";
      rr(84 + i * 250, 560, 210, 12, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(243,240,234,0.25)";
      rr(84 + i * 250, 590, 150, 10, 5);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = `rgba(${LIME},1)`;
    ctx.lineWidth = 4;
    rr(76, 368, 226, 76, 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(${LIME},1)`;
    for (const [x, y] of [[76, 368], [302, 368], [76, 444], [302, 444]]) ctx.fillRect(x - 9, y - 9, 18, 18);
    rr(76, 300, 154, 40, 8);
    ctx.fill();
    ctx.fillStyle = "#0a0a0f";
    ctx.font = `500 20px ${MONO}`;
    ctx.fillText("button 226×76", 90, 310);
    for (let r = 1; r < 4; r++) {
      ctx.strokeStyle = `rgba(${LIME},${0.5 / r})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(900, 440, r * 52, 0, 7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function buildWebPage() {
  const root = new THREE.Group();
  const stack = makeParts();
  stack.rotation.set(-0.26, 0.72, 0.04);
  stack.scale.setScalar(1.22);
  const W = 3.6;
  const H = 2.25;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, 0.16), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 12,
  });
  bodyGeo.translate(0, 0, -0.025);
  const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 30);
  const layers = [];
  [-1.6, -0.8, 0, 0.8, 1.6].forEach((z, i) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x0a0d13,
        metalness: 0.15,
        roughness: 0.3,
        clearcoat: 1,
        envMapIntensity: 0.5,
        transparent: true,
        opacity: i === 0 ? 0.9 : 0.3,
        depthWrite: false,
      })
    );
    body.renderOrder = i;
    const canvas = document.createElement("canvas");
    canvas.width = 1152;
    canvas.height = 720;
    const texture = canvasTexture(canvas);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
    );
    face.position.z = 0.032;
    face.renderOrder = i + 0.5;
    const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xd9ff4a, transparent: true, opacity: 0.55 }));
    group.add(body, face, edges);
    group.position.z = z;
    layers.push({ i, canvas, texture });
    addPart(stack, group, { dir: new THREE.Vector3((i - 2) * 0.35, 0.25 * (i % 2 ? 1 : -1), 1 + (i - 2) * 0.5), dist: 3.6, delay: 0.04 * i });
  });
  // curseur
  const s = new THREE.Shape();
  [[0, 0], [0, -1.0], [0.26, -0.78], [0.42, -1.12], [0.58, -1.05], [0.42, -0.72], [0.74, -0.72]].forEach(([x, y], k) => (k ? s.lineTo(x, y) : s.moveTo(x, y)));
  const cursor = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, metalness: 0.9, roughness: 0.18, clearcoat: 1, emissive: 0xd9ff4a, emissiveIntensity: 0.25 })
  );
  cursor.scale.setScalar(0.85);
  cursor.position.set(0.55, -0.1, 2.2);
  cursor.rotation.set(0.05, 0.05, -0.05);
  addPart(stack, cursor, { dir: new THREE.Vector3(1, -0.5, 2), dist: 3.4, delay: 0.3 });
  root.add(stack);

  const paint = () => {
    layers.forEach(({ i, canvas, texture }) => {
      drawLayer(i, canvas.getContext("2d"), canvas.width, canvas.height);
      texture.needsUpdate = true;
    });
  };
  paint();
  return {
    root,
    parts: stack,
    width: 7.4,
    paint,
    update() {},
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    },
  };
}

/* ---------- Acte IA : l'attention ---------- */
export function buildAttention(timeUniform) {
  const root = new THREE.Group();
  const g = makeParts();
  g.rotation.set(-0.3, 0.5, 0.02);
  g.scale.setScalar(1.12);
  const words = ["Quelle", "est", "la", "marge", "du", "T3", "?"];
  const N = words.length;
  const SP = 0.84;
  const xAt = (i) => (i - (N - 1) / 2) * SP;
  const tokGeo = new THREE.ExtrudeGeometry(roundedRect(0.72, 0.4, 0.09), {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 10,
  });
  tokGeo.translate(0, 0, -0.06);
  const tokens = [];
  words.forEach((word, i) => {
    const hot = i === N - 1;
    const group = new THREE.Group();
    group.add(
      new THREE.Mesh(
        tokGeo,
        new THREE.MeshPhysicalMaterial({ color: hot ? 0x0c2a23 : 0x0e1218, metalness: 0.4, roughness: 0.22, clearcoat: 1, envMapIntensity: 0.8 })
      )
    );
    const canvas = document.createElement("canvas");
    canvas.width = 288;
    canvas.height = 160;
    const texture = canvasTexture(canvas);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.36),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
    );
    face.position.z = 0.082;
    group.add(face);
    tokens.push({ canvas, texture, word, hot });
    group.position.set(xAt(i), 0, 0);
    addPart(g, group, { dir: new THREE.Vector3(0, 1, 0.6), dist: 3.2, delay: 0.03 * i });
  });
  // trois têtes d'attention : le dernier mot regarde les autres, l'épaisseur de l'arc est le poids
  const heads = [
    [[0.39, 0.9, 0.75], [0.18, 0.08, 0.1, 0.9, 0.3, 0.7]],
    [[0.74, 0.39, 1.0], [0.9, 0.7, 0.15, 0.2, 0.1, 0.25]],
    [[0.85, 1.0, 0.29], [0.12, 0.2, 0.7, 0.3, 0.85, 0.4]],
  ];
  heads.forEach(([color, weights], h) => {
    const head = new THREE.Group();
    head.position.z = (h - 1) * 0.5;
    for (let i = 0; i < N - 1; i++) {
      const a = new THREE.Vector3(xAt(N - 1), 0.28, 0);
      const b = new THREE.Vector3(xAt(i), 0.28, 0);
      const c = new THREE.Vector3((a.x + b.x) / 2, 0.55 + Math.abs(a.x - b.x) * 0.34 + h * 0.08, 0);
      head.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, c, b), 56, 0.006 + weights[i] * 0.03, 6),
          pulseMaterial(timeUniform, color, 0.22 + h * 0.05, i * 0.14)
        )
      );
    }
    addPart(g, head, { dir: new THREE.Vector3(0, 1.2, 0.6), dist: 3, delay: 0.2 + h * 0.08 });
  });
  // matrice d'attention : sept rangées, sept colonnes, sous les mots ; le groupe est incliné vers la caméra pour qu'on
  // voie le dessus des barres (de face, elle se lit à plat)
  const matrix = new THREE.Group();
  matrix.position.set(0, -1.45, -0.3);
  matrix.rotation.x = 0.5;
  matrix.scale.setScalar(1.2);
  const cells = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.15, 1, 0.15),
    new THREE.MeshPhysicalMaterial({ color: 0x0b1a16, emissive: 0x1fbf94, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.3, clearcoat: 1 }),
    N * N
  );
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  const lime = new THREE.Color(0xd9ff4a);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v =
        0.06 +
        0.7 * Math.max(Math.exp(-Math.pow(c - r, 2) / 1.6) * 0.55, r === N - 1 ? (c === 3 || c === 5 ? 1 : 0.25) : 0.1) * (0.7 + 0.3 * Math.sin(r * 1.7 + c * 2.1));
      m.compose(new THREE.Vector3((c - (N - 1) / 2) * 0.2, v / 2, (r - (N - 1) / 2) * 0.2), new THREE.Quaternion(), new THREE.Vector3(1, v, 1));
      cells.setMatrixAt(r * N + c, m);
      cells.setColorAt(r * N + c, colour.set(0x1fbf94).lerp(lime, clamp(v / 0.7)));
    }
  }
  matrix.add(cells);
  addPart(g, matrix, { dir: new THREE.Vector3(0, -1, 0.3), dist: 3, delay: 0.1 });
  root.add(g);

  const paint = () => {
    tokens.forEach(({ canvas, texture, word, hot }) => {
      const x = canvas.getContext("2d");
      x.clearRect(0, 0, canvas.width, canvas.height);
      x.fillStyle = hot ? "#63e6be" : "#f3f0ea";
      x.font = `700 62px ${DISPLAY}`;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(word, 144, 86);
      texture.needsUpdate = true;
    });
  };
  paint();
  return {
    root,
    parts: g,
    width: 7.4,
    paint,
    update() {},
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    },
  };
}
