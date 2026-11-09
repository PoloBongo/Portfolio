// M3 · la trame (version retravaillée : cellule plus fine, plus de fantôme). Le vrai clip, un jeu en 3D brumeuse, passe par une
// trame de Bayer 8 × 8 et la palette lavande du logo en pixels : la trame réunit les deux. La cellule va de 4 à 2 px
// (selon la hauteur de l'écran) quand on défile, huit niveaux de gris. Autour du curseur, une fenêtre au bord tramé
// laisse voir l'image réelle.
const dither = /* glsl */ `
float b2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
// Rampe lavande : nuit, prune, brume, crème, par paliers
vec3 ramp(float t) {
  vec3 a = vec3(0.027, 0.02, 0.047);
  vec3 b = vec3(0.208, 0.149, 0.302);
  vec3 c = vec3(0.482, 0.412, 0.659);
  vec3 d = vec3(0.945, 0.941, 0.894);
  if (t < 0.34) return mix(a, b, floor(t * 9.0 + 0.5) / 3.0);
  if (t < 0.67) return mix(b, c, floor((t - 0.33) * 9.0 + 0.5) / 3.0);
  return mix(c, d, floor((t - 0.66) * 9.0 + 0.5) / 3.0);
}
void main() {
  float size = max(1.0, floor(mix(4.0, 2.0, uP) * uRes.y / 900.0 + 0.5));
  vec2 cell = floor(gl_FragCoord.xy / size);
  vec2 uv = (cell * size + size * 0.5) / uRes;
  vec3 tex = texture2D(uTex, cover(uv, uAsp, uVid)).rgb;
  float l = pow(dot(tex, vec3(0.3, 0.59, 0.11)) * 1.3, 0.82);
  float q = floor(l * 8.0 + b8(cell)) / 8.0;
  vec3 col = ramp(clamp(q, 0.0, 1.0));
  vec2 p = (uv - 0.5) * vec2(uAsp, 1.0);
  vec2 m = (uM - 0.5) * vec2(uAsp, 1.0);
  float d = length(p - m);
  float win = smoothstep(0.2, 0.08, d + 0.03 * noise(p * 6.0 + uT * 0.2));
  float on = step(b8(cell + 3.0), win);
  vec3 real = pow(tex, vec3(0.7)) * 1.7;
  col = mix(col, real, on);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default dither;
