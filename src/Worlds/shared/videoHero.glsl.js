// Prélude commun des mondes sur vrai clip : le clip est la matière du monde, un fragment shader (propre à chaque monde)
// traduit la mécanique du jeu. Uniforms communs : uTex (le clip), uVid (son rapport largeur / hauteur), uAsp (celui du
// cadre), uT (secondes), uP (défilement épinglé, ou sortie du cadre, 0 → 1), uVel (vitesse de défilement lissée, ± ~2), uM (pointeur lissé, 0 → 1, v vers le haut), uRes (pixels). Le shader du monde définit main().
export const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Le même bruit que le fond du site (Effects/stage3d/isolines.js)
export const PRELUDE = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uVid, uAsp, uT, uP, uVel;
uniform vec2 uM, uRes;
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
// Le clip couvre le cadre (comme object-fit: cover)
vec2 cover(vec2 uv, float stage, float tex) {
  vec2 s = stage > tex ? vec2(1.0, tex / stage) : vec2(stage / tex, 1.0);
  return (uv - 0.5) * s + 0.5;
}
`;
