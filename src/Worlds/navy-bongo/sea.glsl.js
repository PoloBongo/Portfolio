// Navy Bongo · du soleil à la tempête. Le vrai clip du jeu (le pont d'un voilier pirate) devient la matière : le défilement
// épinglé fait passer le temps du beau temps à la tempête (uP). Le ciel noir du clip est remplacé par un ciel qui change
// (dégradé, nuages en fbm, soleil, éclairs) ; la mer du clip reçoit des reflets de vagues (somme de sinus à crêtes
// aiguës, normales par différences finies) et de l'écume en tempête ; le bateau tangue de plus en plus, la pluie s'abat.
// Un clic tire le canon : flash, onde de choc, fumée et secousse. Le clip a de fines bandes sombres en haut et en bas (CROP).
const sea = /* glsl */ `
uniform vec3 uShot;
const float CROP = 0.055;
float crest(float a) { return pow(1.0 - abs(sin(a)), 2.0) * 2.0 - 1.0; }
float waves(vec2 p, float t) {
  return crest(p.x * 1.7 + t * 1.1 + p.y * 0.6) * 0.5 + crest(p.x * 2.9 - t * 1.6 + p.y * 1.1) * 0.3 + crest(p.x * 5.3 + t * 2.3 - p.y * 1.9) * 0.15;
}
vec3 samp(vec2 uv) {
  vec2 c = cover(uv, uAsp, uVid / (1.0 - 2.0 * CROP));
  c.y = CROP + c.y * (1.0 - 2.0 * CROP);
  return texture2D(uTex, c).rgb;
}
void main() {
  float storm = smoothstep(0.3, 1.0, uP);
  vec2 p0 = (vUv - 0.5) * vec2(uAsp, 1.0);
  float age = max(0.0, uT - uShot.z);
  // le bateau tangue (roulis, tangage) et la secousse du canon
  float roll = sin(uT * 0.7) * 0.012 * (0.35 + storm * 2.4) + sin(uT * 1.3 + 1.0) * 0.005 * storm;
  vec2 p = vec2(p0.x * cos(roll) - p0.y * sin(roll), p0.x * sin(roll) + p0.y * cos(roll));
  p.y += sin(uT * 0.9) * 0.01 * (0.3 + storm * 1.6);
  p += vec2(sin(age * 83.0), cos(age * 71.0)) * exp(-age * 6.0) * 0.012 * step(age, 1.5);
  vec2 uv = p / vec2(uAsp, 1.0) + 0.5;
  vec3 base = samp(uv);
  float lum = dot(base, vec3(0.3, 0.59, 0.11));
  vec3 col = base;

  // ciel : remplace le noir du clip au-dessus de l'horizon
  float skyMask = (1.0 - smoothstep(0.035, 0.11, lum)) * smoothstep(0.56, 0.7, uv.y);
  vec3 top = mix(vec3(0.16, 0.42, 0.86), vec3(0.05, 0.06, 0.09), storm);
  vec3 hor = mix(vec3(0.78, 0.9, 0.98), vec3(0.2, 0.23, 0.28), storm);
  vec3 sky = mix(hor, top, smoothstep(0.55, 1.0, uv.y));
  float cl = fbm(p * vec2(1.4, 3.2) + vec2(uT * 0.02 * (1.0 + storm * 4.0), 0.0));
  sky = mix(sky, mix(vec3(1.0), vec3(0.3, 0.32, 0.36), storm), smoothstep(0.42, 0.78, cl) * mix(0.75, 1.0, storm));
  vec2 sunp = vec2(0.42, 0.34);
  sky += vec3(1.0, 0.9, 0.62) * (exp(-length(p - sunp) * 7.0) * 0.9 + smoothstep(0.06, 0.04, length(p - sunp))) * (1.0 - storm);
  float bolt = pow(max(0.0, sin(uT * 7.0)), 10.0) * step(0.86, noise(vec2(floor(uT * 0.9), 3.0))) * storm;
  sky += vec3(0.75, 0.82, 1.0) * bolt * 1.2;
  col = mix(col, sky, skyMask);

  // mer du clip (les pixels bleus sous l'horizon) : reflets des vagues, écume en tempête
  float seaMask = smoothstep(0.015, 0.09, base.b - base.r * 0.9) * smoothstep(0.66, 0.4, uv.y);
  vec2 q = p * vec2(3.0, 6.5);
  float e = 0.03;
  float h = waves(q, uT);
  vec3 n = normalize(vec3((waves(q + vec2(e, 0.0), uT) - h) / e, (waves(q + vec2(0.0, e), uT) - h) / e, 1.4));
  float spec = pow(max(dot(n, normalize(vec3(-0.35, 0.55, 0.75))), 0.0), 28.0);
  col += vec3(1.0, 0.95, 0.85) * spec * seaMask * (1.0 - storm * 0.55) * 0.55;
  float foam = smoothstep(0.74, 1.0, fbm(q * 2.2 + vec2(uT * 0.5, 0.0)) + h * 0.15) * seaMask * (0.15 + storm * 0.85);
  col = mix(col, vec3(0.92, 0.96, 1.0), foam * 0.55);

  // tempête : ciel et mer s'assombrissent, les couleurs se délavent, la pluie
  float gray = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, vec3(gray), storm * 0.4);
  col *= mix(1.0, 0.62, storm);
  float rain = smoothstep(0.93, 1.0, noise(vec2(vUv.x * uAsp * 140.0 + vUv.y * 26.0, vUv.y * 5.0 + uT * 6.0)));
  col += vec3(0.65, 0.75, 0.9) * rain * smoothstep(0.35, 0.9, uP) * 0.3;
  col += vec3(0.7, 0.78, 1.0) * bolt * 0.35;

  // le canon : flash, onde de choc, fumée
  vec2 sp = uShot.xy;
  float d = length(p0 - sp);
  float flash = exp(-d * 5.0) * exp(-age * 12.0);
  col += vec3(1.0, 0.68, 0.28) * flash * 1.6;
  col += vec3(1.0, 0.85, 0.6) * exp(-pow((d - age * 1.5) * 13.0, 2.0)) * exp(-age * 2.8) * 0.35;
  float smoke = smoothstep(0.45, 0.85, fbm((p0 - sp) * 3.2 + vec2(0.0, age * 0.5))) * exp(-d * 2.4) * smoothstep(0.0, 0.2, age) * exp(-age * 1.4);
  col = mix(col, vec3(0.72, 0.7, 0.68), smoke * 0.6);

  col *= 1.0 - 0.38 * smoothstep(0.4, 1.05, length(p0));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default sea;
