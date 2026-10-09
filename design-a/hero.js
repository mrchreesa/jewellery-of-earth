/* Concept A hero: a river boulder's weathered rind cracks open to show
   polished pounamu, and the pointer becomes a light shining through it.
   Raw WebGL 1, no libraries. Falls back to a CSS gradient (html.no-gl). */
(function () {
  "use strict";

  var canvas = document.getElementById("stone");
  var hero = canvas && canvas.closest(".hero");
  if (!canvas || !hero) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?t=1.4 freezes the sequence at that second (for reviewing stills).
  var freezeMatch = /[?&]t=([\d.]+)/.exec(window.location.search);
  var freezeAt = freezeMatch ? parseFloat(freezeMatch[1]) : -1;

  function fail() {
    document.documentElement.classList.add("no-gl");
    hero.dataset.state = "open";
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
    "uniform float u_intro;",
    "uniform float u_crack;",
    "uniform float u_reveal;",
    "uniform vec2 u_light;",
    "uniform float u_lightAmt;",

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

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res;",
    "  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);",

    // The cut: a jagged line rising gently left to right.
    "  vec2 tang = normalize(vec2(1.0, 0.32));",
    "  vec2 nrm = vec2(-tang.y, tang.x);",
    "  vec2 c0 = vec2(0.05, 0.04);",
    "  float along = dot(p - c0, tang);",
    "  float sd = dot(p - c0, nrm) + 0.03 * fbm3(vec2(along * 3.2, 1.7)) + 0.006 * snoise(p * 26.0);",
    "  float edgeN = 0.5 + 0.5 * fbm3(p * 2.4 + 7.0);",
    "  float w = u_reveal * 1.9 * (0.8 + 0.4 * edgeN);",
    "  float ad = abs(sd);",
    "  float open = 1.0 - smoothstep(w - 0.004, w, ad);",
    "  if (u_reveal <= 0.0) open = 0.0;",
    "  vec3 col = vec3(0.0);",

    // Polished pounamu.
    "  vec3 stone = vec3(0.0);",
    "  if (open > 0.0) {",
    "    vec2 q = vec2(fbm4(p * 0.8 + vec2(0.0, u_time * 0.005)), fbm4(p * 0.8 + vec2(5.2, 1.3)));",
    "    float n = fbm4(p * 0.7 + 1.25 * q);",
    "    float n2 = fbm3(p * 2.2 + q * 0.8 + 3.0);",
    // Nephrite is fibrous: fine parallel streaks give it a silky sheen.
    "    vec2 sp = mat2(0.94, -0.34, 0.34, 0.94) * p;",
    "    float fib = snoise(vec2(sp.x * 1.4 + q.y * 2.0, sp.y * 46.0 + q.x * 9.0));",
    "    float wisp = fbm3(vec2(sp.x * 0.9 + q.y, sp.y * 5.5 + q.x * 2.2));",
    "    float milky = smoothstep(0.15, 0.8, wisp * 0.7 + n * 0.45);",
    "    float base = clamp(0.5 + 0.55 * n + 0.18 * n2, 0.0, 1.0);",
    "    vec3 deep = vec3(0.006, 0.055, 0.032);",
    "    vec3 mid = vec3(0.06, 0.27, 0.16);",
    "    vec3 bright = vec3(0.17, 0.5, 0.3);",
    "    vec3 mat = mix(deep, mid, smoothstep(0.15, 0.7, base));",
    "    mat = mix(mat, bright, smoothstep(0.62, 1.0, base) * 0.6);",
    "    mat = mix(mat, vec3(0.52, 0.68, 0.55), milky * 0.22);",
    "    mat *= 0.965 + 0.035 * fib;",
    // Sparse, soft dark inclusions.
    "    float f1 = snoise(p * 9.0 + q * 2.0);",
    "    float f2 = snoise(p * 3.5 - q);",
    "    float fleck = smoothstep(0.72, 0.93, f1) * smoothstep(0.25, 0.65, f2);",
    "    mat = mix(mat, vec3(0.01, 0.04, 0.026), fleck * 0.5);",
    "    float thick = clamp(0.62 - 0.5 * n - 0.12 * n2 + 0.2 * milky, 0.0, 1.0);",

    // Surface: polished smooth, gently domed; the pattern sits inside the stone.
    "    vec3 N = normalize(vec3(-p.x * 0.22 + 0.01 * fib, -p.y * 0.22, 1.0));",
    "    vec3 V = vec3(0.0, 0.0, 1.0);",
    "    vec3 L1 = normalize(vec3(-0.5, 0.7, 0.75));",
    "    float diff = max(dot(N, L1), 0.0);",
    "    float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 40.0);",
    "    vec3 L2 = normalize(vec3(u_light - p, 0.7));",
    "    float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 90.0);",
    "    float silk = pow(max(dot(N, normalize(L2 + V)), 0.0), 12.0) * (0.5 + 0.5 * fib);",

    // Light passing through the stone from behind the pointer.
    "    float d = length(p - u_light);",
    "    float glow = 1.2 * exp(-d * d * 9.0) + 0.34 * exp(-d * d * 1.3);",
    "    float trans = glow * exp(-thick * 2.0) * (1.0 - fleck * 0.95) * u_lightAmt;",
    "    vec3 tint = mix(vec3(0.2, 0.85, 0.45), vec3(0.75, 1.0, 0.82), milky * 0.6);",
    "    stone = mat * (0.5 + 0.35 * diff) + tint * trans * 1.5;",
    "    stone += vec3(0.8, 1.0, 0.88) * (spec1 * 0.07 + (spec2 * 0.35 + silk * 0.06) * u_lightAmt);",

    // Shadow cast by the rind lip onto the opened stone.
    "    float lip = smoothstep(w - 0.09, w - 0.006, ad);",
    "    stone *= 1.0 - 0.55 * lip;",
    "  }",

    // Weathered rind.
    "  vec3 rind = vec3(0.0);",
    "  if (open < 1.0) {",
    "    float r1 = fbm4(p * 2.1 + 3.1);",
    "    float r3 = snoise(p * 6.5 + 9.0);",
    "    float r2 = snoise(p * 28.0);",
    "    float pit = smoothstep(0.72, 0.95, snoise(p * 11.0 + 4.0));",
    "    float rh = r1 * 0.7 + r3 * 0.25 - pit * 0.08 + r2 * 0.01;",
    "    vec3 rc = mix(vec3(0.19, 0.175, 0.15), vec3(0.45, 0.41, 0.35), smoothstep(-0.6, 0.6, r1));",
    "    rc = mix(rc, vec3(0.52, 0.47, 0.4), smoothstep(0.35, 0.9, r3) * 0.45);",
    "    rc = mix(rc, vec3(0.15, 0.2, 0.16), smoothstep(0.2, 0.9, -r3) * 0.4);",
    "    rc *= (0.93 + 0.08 * r2) * (1.0 - pit * 0.35);",
    "    vec3 Nr = normalize(vec3(-dFdx(rh) * 10.0, -dFdy(rh) * 10.0, 1.0));",
    "    float dr = max(dot(Nr, normalize(vec3(-0.5, 0.7, 0.55))), 0.0);",
    "    rind = rc * (0.35 + 0.85 * dr);",
    // The fractured lip of the rind catches light and shows a band of pale stone.
    "    float rim = smoothstep(w + 0.02, w, ad) * step(0.0001, u_reveal);",
    "    rind = mix(rind, vec3(0.5, 0.58, 0.5), rim * 0.55);",
    "  }",

    "  col = mix(rind, stone, open);",

    // Green light leaking through the crack before it opens.
    "  float head = mix(-1.4, 1.4, u_crack);",
    "  float traced = smoothstep(head, head - 0.08, along);",
    "  float seam = 1.0 - smoothstep(0.0, 0.16, u_reveal);",
    "  float crack = exp(-ad * 140.0) * traced * seam;",
    "  float halo = exp(-ad * 22.0) * traced * seam * 0.35;",
    "  col += vec3(0.55, 1.0, 0.7) * (crack * 1.4 + halo) * step(0.0001, u_crack);",

    "  col *= u_intro;",
    "  col *= 1.0 - 0.45 * pow(length((uv - 0.5) * vec2(1.1, 1.3)), 2.2);",
    "  col = 1.0 - exp(-col * 1.35);",
    "  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var gl, prog, buf, loc = {};
  var scale = 1;
  var running = false, visible = true, raf = 0;
  var startTime = 0, lastFrame = 0, opened = false;
  var light = { x: 0.3, y: 0.12 }, target = { x: 0.3, y: 0.12 };
  var lastPointer = -1e9, lit = false;
  var slowFrames = 0, sampledFrames = 0;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("Stone shader:", gl.getShaderInfoLog(s));
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
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    ["u_res", "u_time", "u_intro", "u_crack", "u_reveal", "u_light", "u_lightAmt"].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });
    return true;
  }

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

  // Shader space: origin at the centre, one unit = the shorter side.
  function halfExtents() {
    var w = canvas.clientWidth, h = canvas.clientHeight, u = Math.max(1, Math.min(w, h));
    return { x: w / 2 / u, y: h / 2 / u };
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // The idle light wanders behind the right half of the stone, away from the copy.
  function drift(t) {
    var e = halfExtents();
    return { x: e.x * (0.42 + 0.28 * Math.sin(t * 0.23)), y: e.y * (0.18 + 0.32 * Math.sin(t * 0.31 + 1.2)) };
  }

  function draw(t) {
    var intro = clamp01(t / 0.6);
    var crack = easeInOut(clamp01((t - 0.5) / 1.0));
    var reveal = easeInOut(clamp01((t - 1.5) / 2.6));
    var lightAmt = easeOut(clamp01((t - 2.0) / 1.8));
    if (reduceMotion) { intro = 1; crack = 1; reveal = 1; lightAmt = 1; }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.u_res, canvas.width, canvas.height);
    gl.uniform1f(loc.u_time, t);
    gl.uniform1f(loc.u_intro, easeOut(intro));
    gl.uniform1f(loc.u_crack, crack);
    gl.uniform1f(loc.u_reveal, reveal);
    gl.uniform2f(loc.u_light, light.x, light.y);
    gl.uniform1f(loc.u_lightAmt, lightAmt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!opened && (reveal > 0.06 || reduceMotion)) {
      opened = true;
      hero.dataset.state = "open";
    }
  }

  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    var t = freezeAt >= 0 ? freezeAt : (now - startTime) / 1000;
    var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
    lastFrame = now;

    if (now - lastPointer > 3000) target = drift(t);
    var k = 1 - Math.exp(-dt * (now - lastPointer > 3000 ? 1.5 : 7));
    light.x += (target.x - light.x) * k;
    light.y += (target.y - light.y) * k;

    draw(t);

    // Drop resolution once if this device struggles after the intro.
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

  function renderStill() {
    var e = halfExtents();
    light.x = target.x = e.x * 0.45;
    light.y = target.y = e.y * 0.25;
    resize();
    draw(10);
  }

  function pointerTo(event) {
    var r = canvas.getBoundingClientRect();
    var u = Math.max(1, Math.min(r.width, r.height));
    target.x = (event.clientX - r.left - r.width / 2) / u;
    target.y = (r.height / 2 - (event.clientY - r.top)) / u;
    lastPointer = performance.now();
    if (!lit && opened) {
      lit = true;
      hero.classList.add("is-lit");
    }
    if (reduceMotion) {
      light.x = target.x;
      light.y = target.y;
      draw(10);
    }
  }

  if (!init()) {
    fail();
    return;
  }

  scale = baseScale();
  resize();
  hero.addEventListener("pointermove", pointerTo);
  hero.addEventListener("pointerdown", pointerTo);

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  });
  canvas.addEventListener("webglcontextrestored", function () {
    if (!init()) { fail(); return; }
    resize();
    if (reduceMotion) renderStill(); else start();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      resize();
      if (reduceMotion) draw(10);
    }).observe(canvas);
  }

  if (reduceMotion) {
    renderStill();
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && running && !raf) { lastFrame = 0; raf = requestAnimationFrame(frame); }
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else {
      start();
    }
  });

  startTime = performance.now();
  target = drift(0);
  light.x = target.x;
  light.y = target.y;
  start();
})();
