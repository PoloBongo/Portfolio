// M8 · la bulle. Le vrai clip (le jeu mobile en portrait : un parc, ses attractions et ses ballons) reste net et clair. Le curseur
// pousse devant lui une bulle-loupe, comme un ballon de baudruche : l'image y est agrandie, le bord irise (les trois couleurs
// se décalent) et un reflet blanc court en haut. Défiler fait onduler l'image par bandes, comme un manège (la vitesse de défilement
// pilote la houle). Un clic fait éclater une bulle : l'onde déforme l'image puis s'éteint.
const bubble = /* glsl */ `
uniform float uPopX, uPopY, uPopT;
vec3 grab(vec2 uv) { return texture2D(uTex, cover(uv, uAsp, uVid)).rgb; }
void main() {
  vec2 uv = vUv;
  // houle par bandes, selon la vitesse de défilement
  float band = floor(uv.y * 14.0);
  uv.x += sin(band * 1.7 + uT * 1.4) * 0.006 * uVel + sin(uv.y * 40.0 + uT) * 0.0015 * abs(uVel);

  // onde d'un éclatement
  vec2 pk = vec2(uPopX, uPopY);
  float t = uT - uPopT;
  vec2 dp = (uv - pk) * vec2(uAsp, 1.0);
  float dd = length(dp);
  float ring = exp(-abs(dd - t * 0.75) * 14.0) * exp(-t * 2.4) * step(0.0, t);
  uv += normalize(dp + 1e-5) * ring * 0.03 / vec2(uAsp, 1.0);

  // la bulle
  vec2 m = uM;
  vec2 d = (uv - m) * vec2(uAsp, 1.0);
  float R = 0.19 + 0.012 * sin(uT * 1.6);
  float r = length(d) / R;
  float inb = 1.0 - smoothstep(0.96, 1.0, r);
  float rim = smoothstep(0.78, 1.0, r) * inb;
  vec2 lens = m + (uv - m) / mix(1.0, 1.7, smoothstep(1.0, 0.0, r));
  vec2 dir = normalize(d + 1e-5) / vec2(uAsp, 1.0);
  float ab = 0.012 * rim;
  vec3 base = grab(uv);
  vec3 inside = vec3(grab(lens + dir * ab).r, grab(lens).g, grab(lens - dir * ab).b);
  vec3 col = mix(base, inside, inb);
  // reflet et irisation du bord
  col += vec3(0.5, 0.6, 0.7) * rim * 0.22;
  float hl = smoothstep(0.35, 0.0, length(d / R - vec2(-0.35, 0.4))) * inb;
  col += vec3(1.0) * hl * 0.5;
  // éclat de l'onde
  col += vec3(1.0, 0.9, 0.7) * ring * 0.35;
  col *= 1.04;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default bubble;
