// M7 · l'inventaire. Le vrai clip (les ruines de grès, le mannequin, la barre d'objets) est rangé dans une grille d'emplacements
// d'inventaire : chaque case est une fenêtre arrondie sur l'image, séparée des autres par le bois sombre du sac. Les cases
// loin du curseur sont ternes, celle qu'on survole s'allume, grossit l'image et prend un liseré doré. En défilant, on range :
// les écarts se ferment et toutes les cases se rejoignent en une seule image. Un clic « ramasse » : une onde dorée part du point.
const slots = /* glsl */ `
uniform float uPickX, uPickY, uPickT;
void main() {
  float cs = max(90.0, uRes.y / 4.6);
  vec2 px = vUv * uRes;
  vec2 cell = floor(px / cs);
  vec2 f = fract(px / cs) - 0.5;
  vec2 cc = (cell + 0.5) * cs / uRes;
  float md = length((cell + 0.5) * cs - uM * uRes) / cs;
  float hov = smoothstep(2.2, 0.4, md);
  float sel = smoothstep(0.85, 0.45, md) * (1.0 - uP);
  float gap = mix(0.065, 0.0, smoothstep(0.0, 0.8, uP));
  float rad = 0.09 * (1.0 - uP);
  vec2 q = abs(f) - vec2(0.5 - gap - rad);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
  float inside = 1.0 - smoothstep(0.0, 0.025, sd);

  vec2 zuv = cc + (vUv - cc) / (1.0 + 0.38 * sel);
  vec3 tex = texture2D(uTex, cover(zuv, uAsp, uVid)).rgb;
  float lum = dot(tex, vec3(0.3, 0.59, 0.11));
  float dim = mix(0.52 + 0.4 * hov, 1.0, uP);
  tex = mix(vec3(lum), tex, mix(0.55, 1.05, hov + uP)) * dim;
  tex *= 1.0 + 0.5 * sel;
  // léger biseau : le haut de chaque case accroche la lumière, le bas est dans l'ombre
  tex += (0.07 * smoothstep(0.1, 0.5, -f.y) - 0.09 * smoothstep(0.1, 0.5, f.y)) * (1.0 - uP);

  vec3 wood = vec3(0.09, 0.055, 0.04) + 0.02 * noise(px / 9.0);
  vec3 gold = vec3(1.0, 0.69, 0.29);
  float ring = (1.0 - smoothstep(0.0, 0.03, abs(sd + 0.012))) * (0.1 + 0.9 * sel) * (1.0 - uP);
  vec3 col = mix(wood, tex, inside);
  col = mix(col, gold, ring * inside);

  // ramasser : onde dorée qui part du clic
  vec2 pk = vec2(uPickX, uPickY);
  float t = uT - uPickT;
  float d = length((vUv - pk) * vec2(uAsp, 1.0));
  float wave = exp(-abs(d - t * 0.9) * 16.0) * exp(-t * 2.2) * step(0.0, t);
  col += gold * wave * 0.7;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default slots;
