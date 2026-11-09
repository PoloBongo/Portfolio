// M4 · la gravité s'inverse. La mécanique du jeu est le geste de la page : un clic retourne le clip en perspective, comme
// la route du jeu. Des traits de vitesse aux couleurs du jeu (rose, violet) filent depuis le centre, leur vitesse suit le
// défilement (uVel) ; la dispersion chromatique des bords aussi. Traits : `pow(noise(...), 26)`, fins et plafonnés, ou ils
// brûlent l'image. Le clip a de fines bandes sombres en haut et en bas : on les rogne (CROP).
const gravity = /* glsl */ `
uniform float uFlip;
const float CROP = 0.055;
vec3 samp(vec2 uv) {
  vec2 c = cover(uv, uAsp, uVid / (1.0 - 2.0 * CROP));
  c.y = CROP + c.y * (1.0 - 2.0 * CROP);
  return texture2D(uTex, c).rgb;
}
void main() {
  vec2 p = vUv - 0.5;
  float a = uFlip * 3.14159;
  float c = cos(a);
  float s = sin(a);
  float z = 1.0 + p.y * s * 1.1;
  vec2 q = vec2(p.x * z, p.y * z / (abs(c) < 0.02 ? 0.02 : c));
  if (abs(q.y) > 0.5 || abs(q.x) > 0.5) {
    gl_FragColor = vec4(0.62, 0.65, 0.69, 1.0);
    return;
  }
  vec2 uv = q + 0.5;
  float speed = clamp(0.35 + uP * 0.9 + abs(uVel) * 0.5, 0.0, 1.6);
  vec2 dir = uv - 0.5;
  float k = 0.014 * speed;
  vec3 v = vec3(
    samp(0.5 + dir * (1.0 - k)).r,
    samp(uv).g,
    samp(0.5 + dir * (1.0 + k)).b
  );
  vec2 r = (uv - 0.5) * vec2(uAsp, 1.0);
  float ang = atan(r.y, r.x);
  float rad = length(r);
  float n = noise(vec2(ang * 70.0, rad * 2.2 - uT * 4.0 * speed));
  float line = pow(n, 26.0) * smoothstep(0.26, 0.8, rad) * speed * 16.0;
  vec3 streak = mix(vec3(1.0, 0.2, 0.7), vec3(0.5, 0.4, 1.0), noise(vec2(ang * 9.0, 0.5)));
  vec3 col = v * (1.0 - 0.3 * smoothstep(0.3, 0.85, rad));
  col += streak * min(line, 1.2) * 0.8;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default gravity;
