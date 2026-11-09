// M1 · la lampe torche. La page est dans le noir, le curseur est une lampe : le vrai clip n'existe que dans le faisceau.
// Nuit bleutée, lames de store, faisceau qui vacille, poussière dans la lumière (un point par cellule, jamais
// `pow(noise)`), halo corail au bord du faisceau, grain.
const lamp = /* glsl */ `
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0);
  vec2 m = (uM - 0.5) * vec2(uAsp, 1.0);
  float d = length(p - m);
  float flick = 0.95 + 0.05 * sin(uT * 37.0) * sin(uT * 13.0);
  float beam = smoothstep(0.66, 0.1, d + 0.03 * noise(p * 5.0 + uT * 0.4)) * flick;
  float core = smoothstep(0.26, 0.0, d);
  vec2 uv = cover(vUv + (p - m) * 0.01 * beam, uAsp, uVid);
  vec3 v = texture2D(uTex, uv).rgb;
  vec3 night = v * vec3(0.035, 0.05, 0.11) + vec3(0.006, 0.009, 0.02);
  float slats = 0.7 + 0.3 * smoothstep(0.35, 0.65, sin((vUv.y + sin(vUv.x * 3.0 + uT * 0.1) * 0.012) * 96.0) * 0.5 + 0.5);
  night *= slats;
  vec3 col = mix(night, v * (1.25 + core * 0.8), beam);
  vec2 gp = p * 30.0 + vec2(uT * 0.14, -uT * 0.22);
  vec2 id = floor(gp);
  vec2 o = fract(gp) - 0.5 - (vec2(hash(id), hash(id + 3.1)) - 0.5) * 0.7;
  float mote = step(0.86, hash(id + 9.7)) * smoothstep(0.11, 0.02, length(o));
  col += vec3(1.0, 0.92, 0.78) * mote * beam * 0.16;
  col += vec3(0.9, 0.34, 0.43) * exp(-pow((d - 0.6) * 13.0, 2.0)) * 0.1;
  col += (hash(gl_FragCoord.xy + uT) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default lamp;
