import * as THREE from "three";

// Fond de la scène : des courbes de niveau qui dérivent (bruit fractal, une courbe fine toutes les 1/15, une plus
// marquée toutes les quatre), comme une carte d'espace latent. Plein écran, transparent : l'aurore reste visible
// dessous. La couleur suit la teinte du monde ou de l'acte ; le curseur et le défilement la déplacent légèrement.
const FRAGMENT = `
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uOpacity;
uniform float uSpeed;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(7.3, 2.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 q = p * 1.6 + uPointer * 0.18 + vec2(0.0, uScroll * 0.00035);
  float t = uTime * 0.03 * uSpeed;
  float n = fbm(q + vec2(t, -t * 0.7)) + 0.35 * fbm(q * 2.1 - vec2(t * 1.3, t));
  float l = n * 15.0;
  float minor = 1.0 - smoothstep(0.0, fwidth(l) * 1.5, abs(fract(l) - 0.5));
  float major = 1.0 - smoothstep(0.0, fwidth(l * 0.25) * 2.4, abs(fract(l * 0.25) - 0.5));
  float vig = mix(0.45, 1.0, smoothstep(1.35, 0.15, length(p * vec2(0.8, 1.0))));
  float a = (minor * 0.2 + major * 0.38 + 0.04 * smoothstep(0.35, 0.85, n)) * vig * uOpacity;
  gl_FragColor = vec4(uColor, a);
}
`;

export function createIsolines() {
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Vector3(0.62, 0.34, 0.98) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uOpacity: { value: 1 },
    uSpeed: { value: 1 },
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
