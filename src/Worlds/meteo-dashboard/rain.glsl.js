// M6 · la pluie sur la vitre (version du site). Le vrai clip du projet, son propre tableau de bord, vu à travers une vitre
// embuée : trois couches de gouttes en grille (dôme `sqrt(1 - d²)`, réfraction, traînées), un flou de 12 échantillons en
// spirale pour la buée, que le curseur essuie (texture de buée, sans repousse). Le temps réel de Tours choisit le mode :
// pluie (uMode 0), neige (1) ou ciel dégagé (2, reflets de soleil, buée légère) ; uInt règle l'intensité, le défilement la module.
const rain = /* glsl */ `
uniform sampler2D uFog;
uniform float uMode, uInt;
vec3 layer(vec2 uv, float t, float cols) {
  vec2 a = vec2(cols * uAsp, cols * 0.55);
  vec2 st = uv * a;
  float col = floor(st.x);
  float speed = 0.16 + 0.22 * hash(vec2(col, 3.1));
  st.y += t * speed + hash(vec2(col, 7.7)) * 4.0;
  vec2 id = floor(st);
  vec2 f = fract(st) - 0.5;
  float h = hash(id + 1.3);
  if (h < 0.62) return vec3(0.0);
  float x = (hash(id + 4.1) - 0.5) * 0.56 + sin(st.y * 7.0 + h * 6.0) * 0.04;
  float y = -0.12 + 0.18 * sin(t * 1.4 + h * 40.0);
  vec2 q = (f - vec2(x, y)) * vec2(1.25, 1.0 + 0.35 * step(0.0, f.y - y));
  float size = 0.13 + 0.12 * fract(h * 7.7);
  float d = length(q) / size;
  float drop = smoothstep(1.0, 0.82, d);
  vec2 n = q / size;
  float dome = sqrt(max(0.0, 1.0 - min(d * d, 1.0)));
  float tr = smoothstep(0.05, 0.01, abs(f.x - x)) * smoothstep(y + 0.06, 0.5, f.y) * step(y, f.y);
  return vec3(-n * dome * drop * 0.05, max(drop, tr * 0.22));
}
vec3 blur(vec2 uv) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.399;
    vec2 o = vec2(cos(a), sin(a)) * sqrt(float(i) + 0.5) * 0.0105;
    c += texture2D(uTex, cover(uv + o, uAsp, uVid)).rgb;
  }
  return c / 12.0;
}
float flakes(vec2 uv, float t, float cols) {
  vec2 st = uv * vec2(cols * uAsp, cols);
  st.y += t * (0.5 + 0.25 * hash(vec2(floor(st.x), 1.0)));
  st.x += sin(t * 0.7 + floor(st.y) * 1.7) * 0.25;
  vec2 id = floor(st);
  vec2 f = fract(st) - 0.5 - (vec2(hash(id), hash(id + 5.1)) - 0.5) * 0.5;
  return step(0.55, hash(id + 9.3)) * smoothstep(0.16, 0.04, length(f));
}
void main() {
  float wetK = uMode < 0.5 ? (0.5 + uP * 0.5) * uInt : (uMode < 1.5 ? 0.0 : 0.0);
  vec3 l1 = layer(vUv, uT, 9.0);
  vec3 l2 = layer(vUv + 0.37, uT * 1.2, 16.0);
  vec3 l3 = layer(vUv + 0.71, uT * 0.8, 30.0);
  vec2 refr = (l1.xy + l2.xy * 0.6 + l3.xy * 0.35) * (uMode < 0.5 ? 1.0 : 0.0);
  float wet = max(l1.z, max(l2.z, l3.z)) * wetK;
  float clear = texture2D(uFog, vUv).r;
  // ciel dégagé : la vitre est presque propre ; neige : buée froide
  clear = max(clear, uMode > 1.5 ? 0.6 : 0.0);
  vec3 sharp = texture2D(uTex, cover(vUv + refr * 2.2, uAsp, uVid)).rgb;
  vec3 soft = blur(vUv) * 0.8 + (uMode > 0.5 && uMode < 1.5 ? vec3(0.16, 0.2, 0.26) : vec3(0.1, 0.13, 0.17));
  vec3 col = mix(soft, sharp * 1.08, clamp(clear + wet, 0.0, 1.0));
  col += vec3(0.85, 0.92, 1.0) * wet * clamp(dot(refr * 40.0, vec2(-0.5, 0.8)), 0.0, 1.0) * 0.5;
  if (uMode > 0.5 && uMode < 1.5) {
    float s = flakes(vUv, uT, 14.0) * 0.9 + flakes(vUv + 0.3, uT * 1.3, 26.0) * 0.6;
    col += vec3(0.92, 0.96, 1.0) * s * uInt * 0.6;
  }
  if (uMode > 1.5) {
    vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0);
    vec2 sun = (uM - 0.5) * vec2(uAsp, 1.0);
    float d = length(p - sun);
    col += vec3(1.0, 0.82, 0.5) * (exp(-d * 4.5) * 0.35 + smoothstep(0.08, 0.0, d) * 0.5);
    col += vec3(1.0, 0.9, 0.7) * exp(-length(p + sun * 0.8) * 9.0) * 0.12;
  }
  col *= 1.0 - 0.3 * smoothstep(0.45, 1.1, length((vUv - 0.5) * vec2(uAsp, 1.0)));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default rain;
