import React, { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Aurore violette : bruit fractal déformé (domain warping) + halo qui suit la souris
const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.045;

  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 1.6 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4),
    fbm(p * 1.6 + 3.0 * q + vec2(8.3, 2.8) - t)
  );
  float f = fbm(p * 1.2 + 3.0 * r);

  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float glow = exp(-distance(p, m) * 3.4);

  vec3 base = vec3(0.039, 0.039, 0.059);
  vec3 violet = vec3(0.45, 0.16, 0.78);
  vec3 magenta = vec3(0.86, 0.30, 0.72);
  vec3 indigo = vec3(0.12, 0.16, 0.62);

  vec3 col = base;
  col = mix(col, indigo, smoothstep(0.35, 0.95, length(q)) * 0.5);
  col = mix(col, violet, smoothstep(0.28, 0.86, f) * 0.62);
  col = mix(col, magenta, smoothstep(0.55, 1.05, length(r)) * 0.24);
  col += vec3(0.74, 0.39, 1.0) * glow * 0.26;

  float vig = 1.0 - smoothstep(0.2, 1.15, length(uv - 0.5) * 1.25);
  col *= mix(0.5, 1.0, vig);
  col = mix(col, base, (1.0 - smoothstep(0.0, 0.5, uv.y)) * 0.92);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Fond WebGL plein cadre. Pause hors écran / onglet masqué, image fixe si mouvement réduit.
// Le canvas est créé ici (et non par React) : chaque montage obtient un contexte neuf,
// ce qui évite de réutiliser un contexte perdu quand React monte deux fois en développement.
export default function Aurora({ className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = document.createElement("canvas");
    canvas.className = "aurora__canvas";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!gl || !vs || !fs) {
      host.classList.add("aurora--fallback");
      host.removeChild(canvas);
      return undefined;
    }
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");

    // Résolution de rendu réduite : le dégradé reste lisse et le coût GPU baisse beaucoup
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const scale = coarse ? 0.35 : 0.5;

    const resize = () => {
      const w = Math.max(2, Math.floor(canvas.clientWidth * scale));
      const h = Math.max(2, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const mouse = { x: 0.62, y: 0.55 };
    const target = { x: 0.62, y: 0.55 };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
    };

    const start = performance.now();
    let raf = 0;
    let inView = true;

    const draw = (now) => {
      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000 + 12);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      if (!raf && inView && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw(start);

    const reduced = prefersReducedMotion();
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else pause();
    });
    const onVisibility = () => (document.hidden ? pause() : play());
    const onResize = () => {
      resize();
      draw(performance.now());
    };

    if (!reduced) {
      observer.observe(canvas);
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pointermove", onMove, { passive: true });
      play();
    }
    window.addEventListener("resize", onResize);

    return () => {
      pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={hostRef} className={`aurora ${className}`} aria-hidden="true" />;
}
