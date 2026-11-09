// M5 · la maquette de fête foraine (remplace le mur d'ampoules). Le vrai clip du jeu, vu comme une maquette : une bande
// nette (mise au point) suit le curseur, tout le reste est flou, et le flou fait de chaque lumière de la fête un bokeh
// (échantillons pondérés par la luminance : les ampoules gonflent en disques). Le défilement accentue le flou, un clic
// donne un coup de flash chaud. Étalonnage chaud de nuit de fête, vignettage. Le clip a de fines bandes sombres en haut
// et en bas : on les rogne (CROP).
const tiltshift = /* glsl */ `
uniform float uFlashT;
const float CROP = 0.055;
vec3 samp(vec2 uv) {
  vec2 c = cover(uv, uAsp, uVid / (1.0 - 2.0 * CROP));
  c.y = CROP + c.y * (1.0 - 2.0 * CROP);
  return texture2D(uTex, c).rgb;
}
void main() {
  float dy = abs(vUv.y - uM.y);
  float coc = smoothstep(0.1, 0.42, dy) * (0.014 + 0.02 * uP);
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / 18.0);
    float a = fi * 2.39996 + uT * 0.04;
    vec2 o = vec2(cos(a), sin(a)) * r * coc * vec2(1.0 / uAsp, 1.0);
    vec3 s = samp(vUv + o);
    float l = dot(s, vec3(0.3, 0.59, 0.11));
    float w = 1.0 + 12.0 * l * l * l;
    acc += s * w;
    wsum += w;
  }
  vec3 col = acc / wsum;
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col += col * smoothstep(0.0, 0.03, coc) * smoothstep(0.35, 0.9, lum) * 0.5;
  col = pow(col, vec3(0.88)) * vec3(1.14, 1.0, 0.84);
  col = mix(vec3(dot(col, vec3(0.3, 0.59, 0.11))), col, 1.3);
  vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0);
  col *= 1.0 - 0.4 * smoothstep(0.35, 1.0, length(p));
  float f = exp(-max(0.0, uT - uFlashT) * 4.5);
  col *= 1.0 + 0.6 * f;
  col += vec3(1.0, 0.72, 0.3) * f * 0.14;
  col += (hash(gl_FragCoord.xy + uT) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default tiltshift;
