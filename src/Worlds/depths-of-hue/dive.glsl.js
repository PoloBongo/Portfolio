// M2 · la plongée. Le défilement est la profondeur : l'absorption de la lumière est physique (le rouge disparaît d'abord,
// puis le vert), tout est désaturé sauf autour du curseur où la couleur revient, et un clic lance une onde qui rend la
// couleur à tout l'écran. Caustiques (Voronoï F2 − F1 déformé) et rayons près de la surface, éteints en profondeur.
// Le clip a des bandes noires en haut et en bas : on les rogne (CROP).
const dive = /* glsl */ `
uniform vec3 uPulse;
const float CROP = 0.11;
float caust(vec2 p, float t) {
  p += 0.35 * vec2(noise(p * 0.9 + t * 0.2), noise(p * 0.9 - t * 0.17));
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = 8.0;
  float b = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash(i + g), hash(i + g + 7.3));
      o = 0.5 + 0.5 * sin(t * 0.9 + 6.2831 * o);
      float d = length(g + o - f);
      if (d < a) {
        b = a;
        a = d;
      } else if (d < b) {
        b = d;
      }
    }
  }
  return pow(1.0 - smoothstep(0.0, 0.17, b - a), 2.0);
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAsp, 1.0);
  vec2 m = (uM - 0.5) * vec2(uAsp, 1.0);
  float depth = uP * 2.6;
  vec2 wob = vec2(sin(vUv.y * 9.0 + uT * 0.8), cos(vUv.x * 7.0 + uT * 0.6)) * 0.0035;
  vec2 cuv = cover(vUv + wob, uAsp, uVid / (1.0 - 2.0 * CROP));
  cuv.y = CROP + cuv.y * (1.0 - 2.0 * CROP);
  vec3 v = texture2D(uTex, cuv).rgb;
  v = pow(v, vec3(0.78)) * 1.25;
  vec3 sea = v * exp(-depth * vec3(2.6, 0.82, 0.3)) + vec3(0.0, 0.035, 0.05) * depth;
  vec3 gray = vec3(dot(sea, vec3(0.3, 0.59, 0.11)));
  sea = mix(gray, sea, 0.62);
  float r = length(p - m);
  float n = noise(p * 5.0 + uT * 0.3);
  float hue = smoothstep(0.34, 0.06, r + 0.05 * n);
  float age = uT - uPulse.z;
  if (age < 3.0) {
    float dp = length(p - uPulse.xy);
    float front = age * 0.85;
    hue = max(hue, smoothstep(front + 0.04, front - 0.1, dp) * smoothstep(3.0, 1.2, age));
    hue += exp(-pow((dp - front) * 22.0, 2.0)) * smoothstep(3.0, 0.4, age) * 0.6;
  }
  vec3 vivid = v * vec3(1.45, 1.2, 1.05);
  vec3 col = mix(sea, vivid, clamp(hue, 0.0, 1.0));
  float near = exp(-depth * 1.4);
  float c = caust(p * 7.5 + vec2(3.0, uT * 0.05), uT) * smoothstep(-0.55, 0.5, p.y);
  col += vec3(0.35, 0.85, 0.75) * c * near * 0.22 * (1.0 - hue * 0.5);
  float rays = pow(noise(vec2(p.x * 4.0 + p.y * 1.3, uT * 0.14)), 3.0) * smoothstep(-0.5, 0.5, p.y) * near;
  col += vec3(0.5, 0.85, 0.8) * rays * 0.45;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default dive;
