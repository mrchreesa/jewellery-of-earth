/* Concept chooser: the two materials meet at one cut. Greenstone on one side
   (concept A), engraved Tuareg silver on the other (concept B). A line of
   light cracks down the seam on arrival and both materials open out from it.
   The pointer is a light: it glows through the stone and rakes across the
   silver. The seam follows the panels as they widen on hover.
   Raw WebGL 1, no libraries. Falls back to CSS gradients (html.no-gl). */
(function () {
  "use strict";

  var canvas = document.getElementById("seam");
  var page = document.querySelector(".concepts");
  var panelA = document.querySelector(".concept.a");
  var panelB = document.querySelector(".concept.b");
  if (!canvas || !page || !panelA || !panelB) return;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fail() {
    root.classList.add("no-gl");
    root.classList.add("is-open");
  }

  var VERT = "attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }";

  var FRAG = [
    "#extension GL_OES_standard_derivatives : enable",
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 u_res;",
    "uniform float u_time;",
    "uniform float u_crack;",
    "uniform float u_open;",
    "uniform vec2 u_light;",
    "uniform float u_split;",
    "uniform float u_focus;",
    "uniform float u_vertical;",
    "uniform float u_ext;",

    // Simplex noise: Ian McEwan, Ashima Arts (MIT).
    "vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }",
    "float snoise(vec2 v){",
    "  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);",
    "  vec2 i = floor(v + dot(v, C.yy));",
    "  vec2 x0 = v - i + dot(i, C.xx);",
    "  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);",
    "  vec4 x12 = x0.xyxy + C.xxzz;",
    "  x12.xy -= i1;",
    "  i = mod(i, 289.0);",
    "  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));",
    "  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);",
    "  m = m*m; m = m*m;",
    "  vec3 x = 2.0 * fract(p * C.www) - 1.0;",
    "  vec3 h = abs(x) - 0.5;",
    "  vec3 ox = floor(x + 0.5);",
    "  vec3 a0 = x - ox;",
    "  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);",
    "  vec3 g;",
    "  g.x = a0.x * x0.x + h.x * x0.y;",
    "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
    "  return 130.0 * dot(m, g);",
    "}",
    "float fbm4(vec2 p){ float s = 0.0; float a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);",
    "  for (int i = 0; i < 4; i++){ s += a * snoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; } return s; }",
    "float fbm3(vec2 p){ float s = 0.0; float a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);",
    "  for (int i = 0; i < 3; i++){ s += a * snoise(p); p = r * p * 2.03 + 5.3; a *= 0.5; } return s; }",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",

    // Polished pounamu, lit from behind (as in concept A).
    "vec3 pounamu(vec2 p, vec2 lt, float amt){",
    "  vec2 q = vec2(fbm4(p * 0.8 + vec2(0.0, u_time * 0.006)), fbm4(p * 0.8 + vec2(5.2, 1.3)));",
    "  float n = fbm4(p * 0.7 + 1.25 * q);",
    "  float n2 = fbm3(p * 2.2 + q * 0.8 + 3.0);",
    "  vec2 sp = mat2(0.94, -0.34, 0.34, 0.94) * p;",
    "  float fib = snoise(vec2(sp.x * 1.4 + q.y * 2.0, sp.y * 46.0 + q.x * 9.0));",
    "  float wisp = fbm3(vec2(sp.x * 0.9 + q.y, sp.y * 5.5 + q.x * 2.2));",
    "  float milky = smoothstep(0.15, 0.8, wisp * 0.7 + n * 0.45);",
    "  float base = clamp(0.5 + 0.55 * n + 0.18 * n2, 0.0, 1.0);",
    "  vec3 mat = mix(vec3(0.006, 0.055, 0.032), vec3(0.06, 0.27, 0.16), smoothstep(0.15, 0.7, base));",
    "  mat = mix(mat, vec3(0.17, 0.5, 0.3), smoothstep(0.62, 1.0, base) * 0.6);",
    "  mat = mix(mat, vec3(0.52, 0.68, 0.55), milky * 0.22);",
    "  mat *= 0.965 + 0.035 * fib;",
    "  float fleck = smoothstep(0.72, 0.93, snoise(p * 9.0 + q * 2.0)) * smoothstep(0.25, 0.65, snoise(p * 3.5 - q));",
    "  mat = mix(mat, vec3(0.01, 0.04, 0.026), fleck * 0.5);",
    "  float thick = clamp(0.62 - 0.5 * n - 0.12 * n2 + 0.2 * milky, 0.0, 1.0);",
    "  vec3 N = normalize(vec3(-p.x * 0.18 + 0.01 * fib, -p.y * 0.18, 1.0));",
    "  vec3 L2 = normalize(vec3(lt - p, 0.7));",
    "  float spec2 = pow(max(dot(N, normalize(L2 + vec3(0.0, 0.0, 1.0))), 0.0), 90.0);",
    "  float silk = pow(max(dot(N, normalize(L2 + vec3(0.0, 0.0, 1.0))), 0.0), 12.0) * (0.5 + 0.5 * fib);",
    "  float d = length(p - lt);",
    "  float glow = 1.2 * exp(-d * d * 9.0) + 0.34 * exp(-d * d * 1.3);",
    "  float trans = glow * exp(-thick * 2.0) * (1.0 - fleck * 0.95) * amt;",
    "  vec3 tint = mix(vec3(0.2, 0.85, 0.45), vec3(0.75, 1.0, 0.82), milky * 0.6);",
    "  vec3 col = mat * 0.62 + tint * trans * 1.5;",
    "  col += vec3(0.8, 1.0, 0.88) * (spec2 * 0.35 + silk * 0.06) * amt;",
    "  return col;",
    "}",

    // Brushed silver engraved with a Tuareg lattice (as in concept B).
    "vec3 silver(vec2 p, vec2 lt, float amt, float sd, float along){",
    "  float fine = 1.0 - 0.35 * u_vertical;",
    "  float brush = snoise(vec2(p.x * 1.6, p.y * 240.0)) * 0.6 + snoise(vec2(p.x * 0.5, p.y * 70.0)) * 0.4;",
    "  float s = 0.082 * mix(1.0, 1.3, u_vertical);",
    "  vec2 g = vec2(p.x + p.y, p.x - p.y) / s;",
    "  vec2 dl = (0.5 - abs(fract(g) - 0.5)) * s * 0.7071;",
    "  float aa = fwidth(dl.x) + 1e-4;",
    "  float groove = max(1.0 - smoothstep(0.0009, 0.0009 + aa, dl.x), 1.0 - smoothstep(0.0009, 0.0009 + aa, dl.y));",
    "  float dotd = length(fract(g) - 0.5) * s * 0.7071;",
    "  float dots = 1.0 - smoothstep(0.0038, 0.0038 + aa, dotd);",
    // A border band along the seam: two lines with a zigzag between them.
    "  float bandD = sd - 0.035;",
    "  float zig = 0.012 + 0.012 * abs(fract(along * 9.0) - 0.5) * 2.0;",
    "  float ab = fwidth(sd) + 1e-4;",
    "  float band = max(max(1.0 - smoothstep(0.0014, 0.0014 + ab, abs(bandD)), 1.0 - smoothstep(0.0014, 0.0014 + ab, abs(bandD - 0.036))),",
    "                   1.0 - smoothstep(0.0014, 0.0014 + ab, abs(bandD - zig)));",
    "  float field = smoothstep(0.075, 0.09, sd);",
    "  float cut = max(band, max(groove, dots) * field * fine);",
    "  float h = -cut;",
    "  vec3 N = normalize(vec3(-dFdx(h) * 1.6, -dFdy(h) * 1.6, 1.0));",
    "  vec3 L = normalize(vec3(lt - p, 0.42));",
    "  float diff = max(dot(N, L), 0.0);",
    "  float d = length(lt - p);",
    "  float sheen = exp(-d * d * 2.4);",
    "  float spec = pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 26.0);",
    "  vec3 base = mix(vec3(0.5, 0.53, 0.58), vec3(0.8, 0.82, 0.86), 0.55 + 0.25 * brush);",
    "  vec3 col = base * (0.5 + 0.42 * diff);",
    "  col += vec3(0.95, 0.97, 1.0) * sheen * (0.22 + 0.2 * brush) * amt;",
    "  col += vec3(1.0) * spec * sheen * 0.55 * amt;",
    "  col *= 1.0 - 0.3 * cut;",
    "  return col;",
    "}",

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);",
    "  float across = mix(p.x, -p.y, u_vertical);",
    "  float along = mix(-p.y, p.x, u_vertical);",
    "  float sdSmooth = across - u_split - 0.16 * along + 0.022 * fbm3(vec2(along * 3.2, 1.7));",
    "  float sd = sdSmooth + 0.004 * snoise(p * 30.0);",
    "  float aa = fwidth(sd) + 1e-4;",
    "  float side = smoothstep(-aa, aa, sd);",
    "  vec2 lt = u_light;",
    "  float amtA = 0.8 + 0.4 * max(0.0, -u_focus);",
    "  float amtB = 0.8 + 0.4 * max(0.0, u_focus);",

    "  vec3 a = vec3(0.0); vec3 b = vec3(0.0);",
    "  if (sd < 0.01) a = pounamu(p, lt, amtA) * (1.0 - 0.25 * max(0.0, u_focus));",
    "  if (sd > -0.01) b = silver(p, lt, amtB, sdSmooth, along) * (1.0 - 0.22 * max(0.0, -u_focus));",
    "  vec3 col = mix(a, b, side);",

    // The stone's lip is shadowed and the silver's edge is bevelled.
    "  col *= 1.0 - 0.45 * exp(-max(-sd, 0.0) * 60.0) * (1.0 - side);",
    "  col += vec3(0.9, 0.95, 1.0) * 0.35 * exp(-abs(sd - 0.006) * 500.0) * side;",

    // Both materials open out from the seam.
    "  float w = u_open * 2.4 * (0.85 + 0.3 * (0.5 + 0.5 * fbm3(p * 2.0 + 4.0)));",
    "  float open = 1.0 - smoothstep(w - 0.06, w, abs(sd));",
    "  col = mix(vec3(0.012, 0.02, 0.017), col, open);",

    // The crack: a line of green-white light drawn down the seam first.
    "  float head = mix(-u_ext - 0.1, u_ext + 0.1, u_crack);",
    "  float traced = 1.0 - smoothstep(head - 0.06, head, along);",
    "  float line = exp(-abs(sd) * 170.0) * traced;",
    "  float halo = exp(-abs(sd) * 22.0) * traced * (1.0 - u_open) * 0.4;",
    "  col += vec3(0.62, 1.0, 0.76) * (line * (1.5 - 1.0 * u_open) + halo);",

    "  col *= 1.0 - 0.4 * pow(length((uv - 0.5) * vec2(1.05, 1.25)), 2.2);",
    "  col = 1.0 - exp(-col * 1.4);",
    "  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var gl, prog, loc = {};
  var scale = 1, running = false, visible = true, raf = 0;
  var startTime = 0, lastFrame = 0, opened = false;
  var light = { x: 0, y: 0.1 }, target = { x: 0, y: 0.1 };
  var lastPointer = -1e9, focus = 0, focusTarget = 0;
  var slowFrames = 0, sampledFrames = 0;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("Seam shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function init() {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) return false;
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    ["u_res", "u_time", "u_crack", "u_open", "u_light", "u_split", "u_focus", "u_vertical", "u_ext"].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });
    return true;
  }

  function vertical() { return window.matchMedia("(max-width: 760px)").matches; }

  function baseScale() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    return dpr * (window.innerWidth < 800 ? 0.6 : 0.7);
  }

  function resize() {
    var w = Math.max(1, Math.round(canvas.clientWidth * scale));
    var h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Shader space: origin at the canvas centre, one unit = the shorter side.
  function toShader(x, y) {
    var r = canvas.getBoundingClientRect();
    var u = Math.max(1, Math.min(r.width, r.height));
    return { x: (x - r.left - r.width / 2) / u, y: (r.height / 2 - (y - r.top)) / u, u: u, r: r };
  }

  // The seam sits exactly on the boundary between the two panels.
  function split() {
    var a = panelA.getBoundingClientRect();
    if (vertical()) return toShader(0, a.bottom).y * -1;
    return toShader(a.right, 0).x;
  }

  function extent() {
    var r = canvas.getBoundingClientRect(), u = Math.max(1, Math.min(r.width, r.height));
    return (vertical() ? r.width : r.height) / 2 / u;
  }

  // The idle light wanders across both materials.
  function drift(t) {
    var r = canvas.getBoundingClientRect(), u = Math.max(1, Math.min(r.width, r.height));
    var ex = r.width / 2 / u, ey = r.height / 2 / u;
    return { x: ex * 0.62 * Math.sin(t * 0.19), y: ey * (0.25 + 0.3 * Math.sin(t * 0.27 + 1.1)) };
  }

  function draw(t) {
    var crack = easeInOut(clamp01((t - 0.3) / 1.1));
    var open = easeInOut(clamp01((t - 1.25) / 2.4));
    if (reduceMotion) { crack = 1; open = 1; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.u_res, canvas.width, canvas.height);
    gl.uniform1f(loc.u_time, t);
    gl.uniform1f(loc.u_crack, crack);
    gl.uniform1f(loc.u_open, open);
    gl.uniform2f(loc.u_light, light.x, light.y);
    gl.uniform1f(loc.u_split, split());
    gl.uniform1f(loc.u_focus, focus);
    gl.uniform1f(loc.u_vertical, vertical() ? 1 : 0);
    gl.uniform1f(loc.u_ext, extent());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!opened && (open > 0.15 || reduceMotion)) {
      opened = true;
      root.classList.add("is-open");
    }
  }

  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    var t = (now - startTime) / 1000;
    var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
    lastFrame = now;
    var idle = now - lastPointer > 2500;
    if (idle) target = drift(t);
    var k = 1 - Math.exp(-dt * (idle ? 1.4 : 7));
    light.x += (target.x - light.x) * k;
    light.y += (target.y - light.y) * k;
    focus += (focusTarget - focus) * (1 - Math.exp(-dt * 5));
    draw(t);

    if (t > 4 && sampledFrames < 90) {
      sampledFrames++;
      if (dt > 0.026) slowFrames++;
      if (sampledFrames === 90 && slowFrames > 45 && scale > 0.4) {
        scale *= 0.7;
        resize();
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function still() {
    var d = drift(1);
    light.x = target.x = d.x;
    light.y = target.y = d.y;
    resize();
    draw(10);
  }

  function pointerTo(event) {
    var s = toShader(event.clientX, event.clientY);
    target.x = s.x;
    target.y = s.y;
    lastPointer = performance.now();
    if (reduceMotion) { light.x = target.x; light.y = target.y; draw(10); }
  }

  function setFocus(v) {
    focusTarget = v;
    if (reduceMotion) { focus = v; draw(10); }
  }

  if (!init()) {
    fail();
    return;
  }

  scale = baseScale();
  resize();
  page.addEventListener("pointermove", pointerTo);
  page.addEventListener("pointerdown", pointerTo);
  [[panelA, -1], [panelB, 1]].forEach(function (pair) {
    pair[0].addEventListener("pointerenter", function () { setFocus(pair[1]); });
    pair[0].addEventListener("focus", function () { setFocus(pair[1]); });
    pair[0].addEventListener("pointerleave", function () { setFocus(0); });
    pair[0].addEventListener("blur", function () { setFocus(0); });
  });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  });
  canvas.addEventListener("webglcontextrestored", function () {
    if (!init()) { fail(); return; }
    resize();
    if (reduceMotion) still(); else start();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      resize();
      if (reduceMotion) draw(10);
    }).observe(canvas);
  }
  // The panels animate their widths on hover; in reduced motion redraw once they settle.
  if (reduceMotion) {
    page.addEventListener("transitionend", function () { draw(10); });
    still();
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && running && !raf) { lastFrame = 0; raf = requestAnimationFrame(frame); }
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else start();
  });

  startTime = performance.now();
  var d0 = drift(0);
  light.x = target.x = d0.x;
  light.y = target.y = d0.y;
  start();
})();
