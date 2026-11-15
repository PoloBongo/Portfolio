import * as THREE from "three";

// Fond « pages noires » du tome (refonte manga) : remplace les courbes de niveau. Trois couches d'encre, comme sur
// une planche de manga imprimée :
// 1. une trame de points (inclinée à 45°) dont la taille suit des nuages d'encre qui dérivent lentement ;
// 2. des traits de vitesse verticaux quand on fait défiler vite (le sens du défilement donne la traînée) ;
// 3. des lignes de concentration (focus lines) autour d'un point, au moment d'un impact (Effects/anime/impact.js).
// Transparent : la couleur du fond reste celle de la page. La teinte suit le monde ou la page.
const FRAGMENT = `
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uOpacity;
uniform float uVel;
uniform float uImpact;
uniform vec2 uFocus;
uniform float uDpr;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float p) { return fract(sin(p * 91.345) * 47453.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(7.3, 2.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;

  // 1. Trame : grille tournée à 45°, un point par cellule ; le rayon suit le nuage d'encre
  float cell = 9.0 * uDpr;
  vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * frag / cell;
  vec2 c = fract(g) - 0.5;
  vec2 q = p * 1.25 + uPointer * 0.12 + vec2(0.0, uScroll * 0.00028);
  float t = uTime * 0.025;
  float n = fbm(q + vec2(t, -t * 0.6)) + 0.4 * fbm(q * 2.3 - vec2(t * 1.4, t));
  float cloud = smoothstep(0.62, 1.05, n);
  float r = 0.5 * sqrt(cloud) * 0.92;
  float aa = 1.2 / cell;
  float pip = 1.0 - smoothstep(r - aa, r + aa, length(c));
  float vig = mix(0.5, 1.0, smoothstep(1.4, 0.2, length(p * vec2(0.75, 1.0))));
  float tone = pip * vig * 0.26;

  // 2. Traits de vitesse : colonnes fines au hasard, qui filent dans le sens du défilement
  float col = floor(frag.x / (3.0 * uDpr));
  float h = hash1(col);
  float lenY = uRes.y * (0.15 + 0.5 * hash1(col + 3.1));
  float y = fract((frag.y + uScroll * uDpr * (0.6 + h) + h * 997.0) / lenY);
  float streak = step(0.86, h) * smoothstep(0.0, 0.25, y) * (1.0 - smoothstep(0.25, 1.0, y));
  float edge = smoothstep(0.08, 0.5, abs(p.x) / (uRes.x / uRes.y));
  float speed = streak * edge * clamp(uVel, 0.0, 1.0) * 0.55;

  // 3. Lignes de concentration : rayons fins autour du point d'impact, le centre reste vide
  vec2 d = p - uFocus;
  float ang = atan(d.y, d.x);
  float k = ang * 70.0;
  float ray = hash1(floor(k) + floor(uTime * 24.0) * 0.37);
  float thin = 1.0 - smoothstep(0.0, 0.5, abs(fract(k) - 0.5) * (1.0 + ray * 3.0));
  float ring = smoothstep(0.18 + 0.25 * ray, 0.62 + 0.3 * ray, length(d));
  float focus = step(0.45, ray) * thin * ring * uImpact;

  float a = (tone + speed + focus * 0.9) * uOpacity;
  vec3 ink = mix(uColor, vec3(0.96, 0.94, 0.9), 0.55 + 0.35 * max(focus, speed));
  gl_FragColor = vec4(ink, clamp(a, 0.0, 1.0));
}
`;

export function createInkfield() {
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Vector3(1, 0.23, 0.12) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uOpacity: { value: 1 },
    uVel: { value: 0 },
    uImpact: { value: 0 },
    uFocus: { value: new THREE.Vector2() },
    uDpr: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: "void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }",
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return {
    mesh,
    uniforms,
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
