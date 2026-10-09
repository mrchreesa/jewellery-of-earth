/* Concept B hero: a Tuareg silver plate is engraved line by line, then four
   stones are set into it. The pointer is a raking light across the metal.
   Raw WebGL 1, no libraries. Falls back to CSS stones (html.no-gl). */
(function () {
  "use strict";

  var canvas = document.getElementById("plate");
  var hero = canvas && canvas.closest(".hero");
  if (!canvas || !hero) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?t=2 freezes the sequence at that second (for reviewing stills).
  var freezeMatch = /[?&]t=([\d.]+)/.exec(window.location.search);
  var freezeAt = freezeMatch ? parseFloat(freezeMatch[1]) : -1;

  var ORDER = ["pounamu", "turquoise", "amber", "opal"]; // shader material index
  var SET_ORDER = ["amber", "opal", "pounamu", "turquoise"]; // order the stones are set

  function fail() {
    document.documentElement.classList.add("no-gl");
    hero.dataset.state = "set";
  }

  var VERT = "attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }";

  var FRAG = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform sampler2D u_engr;",
    "uniform vec2 u_res;",
    "uniform vec2 u_texel;",
    "uniform float u_time;",
    "uniform float u_engrave;",
    "uniform vec2 u_light;",
    "uniform float u_tilt;",
    "uniform vec3 u_stone[4];",
    "uniform float u_stoneT[4];",
    "uniform float u_hover[4];",

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
    "float fbm3(vec2 p){ float s = 0.0; float a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);",
    "  for (int i = 0; i < 3; i++){ s += a * snoise(p); p = r * p * 2.03 + 5.3; a *= 0.5; } return s; }",
    "vec2 hash22(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",

    // Voronoi: x = distance to nearest point, y = distance to cell edge, z = cell id.
    "vec3 voronoi(vec2 x){",
    "  vec2 n = floor(x); vec2 f = fract(x); vec2 mg = vec2(0.0); vec2 mr = vec2(0.0); float md = 8.0;",
    "  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {",
    "    vec2 g = vec2(float(i), float(j)); vec2 r = g + hash22(n + g) - f; float d = dot(r, r);",
    "    if (d < md) { md = d; mr = r; mg = g; }",
    "  }",
    "  float ed = 8.0;",
    "  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {",
    "    vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + hash22(n + g) - f;",
    "    if (dot(mr - r, mr - r) > 0.00001) ed = min(ed, dot(0.5 * (mr + r), normalize(r - mr)));",
    "  }",
    "  return vec3(sqrt(md), ed, hash22(n + mg).x);",
    "}",
    "float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }",
    "vec3 spectrum(float t){ return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }",

    // A small insect, caught in the amber. q is in stone space (radius 1).
    "float insect(vec2 q){",
    "  q -= vec2(-0.16, 0.06);",
    "  float c = cos(0.45); float s = sin(0.45); q = mat2(c, -s, s, c) * q;",
    "  float d = sdSeg(q, vec2(-0.13, 0.0), vec2(0.07, 0.0)) - 0.042;",
    "  d = min(d, length(q - vec2(0.12, 0.0)) - 0.034);",
    "  d = min(d, sdSeg(q, vec2(0.0, 0.0), vec2(-0.05, 0.13)) - 0.007);",
    "  d = min(d, sdSeg(q, vec2(-0.05, 0.13), vec2(-0.11, 0.17)) - 0.006);",
    "  d = min(d, sdSeg(q, vec2(0.0, 0.0), vec2(-0.03, -0.13)) - 0.007);",
    "  d = min(d, sdSeg(q, vec2(-0.03, -0.13), vec2(-0.1, -0.18)) - 0.006);",
    "  d = min(d, sdSeg(q, vec2(0.05, 0.0), vec2(0.1, 0.12)) - 0.007);",
    "  d = min(d, sdSeg(q, vec2(0.05, 0.0), vec2(0.11, -0.12)) - 0.007);",
    "  d = min(d, sdSeg(q, vec2(-0.06, 0.0), vec2(-0.12, 0.11)) - 0.006);",
    "  d = min(d, sdSeg(q, vec2(-0.06, 0.0), vec2(-0.14, -0.1)) - 0.006);",
    "  d = min(d, sdSeg(q, vec2(0.14, 0.01), vec2(0.24, 0.07)) - 0.004);",
    "  d = min(d, sdSeg(q, vec2(0.14, -0.01), vec2(0.23, -0.06)) - 0.004);",
    "  return d;",
    "}",
    "float wings(vec2 q){",
    "  q -= vec2(-0.16, 0.06);",
    "  float c = cos(0.45); float s = sin(0.45); q = mat2(c, -s, s, c) * q;",
    "  vec2 a = (q - vec2(-0.06, 0.07)) * vec2(1.0, 2.6);",
    "  vec2 b = (q - vec2(-0.06, -0.07)) * vec2(1.0, 2.6);",
    "  return min(length(a), length(b)) - 0.12;",
    "}",

    "void main(){",
    "  vec2 fc = gl_FragCoord.xy;",
    "  vec2 uv = fc / u_res;",
    "  float unit = min(u_res.x, u_res.y);",
    "  vec2 sp = fc / unit;",

    // Silver plate: matte, faintly brushed and hammered.
    "  float brush = snoise(vec2(fc.x * 0.0035, fc.y * 0.42)) * 0.6 + snoise(vec2(fc.x * 0.012, fc.y * 1.1)) * 0.4;",
    "  float mottle = fbm3(sp * 2.6);",
    "  vec4 e = texture2D(u_engr, uv);",
    "  float cov = e.r;",
    "  float ord = cov > 0.004 ? e.g / cov : 2.0;",
    "  float cut = smoothstep(ord - 0.012, ord, u_engrave);",
    "  float hL = texture2D(u_engr, uv - vec2(u_texel.x, 0.0)).r;",
    "  float hR = texture2D(u_engr, uv + vec2(u_texel.x, 0.0)).r;",
    "  float hD = texture2D(u_engr, uv - vec2(0.0, u_texel.y)).r;",
    "  float hU = texture2D(u_engr, uv + vec2(0.0, u_texel.y)).r;",
    "  vec2 grad = vec2(hR - hL, hU - hD) * cut;",
    "  vec3 N = normalize(vec3(grad * 1.8 + vec2(snoise(sp * 3.1) * 0.035, snoise(sp * 3.1 + 7.0) * 0.035) + vec2(0.0, brush * 0.012), 1.0));",

    "  vec3 P = vec3(fc, 0.0);",
    "  vec3 Lp = vec3(u_light, unit * 0.26);",
    "  vec3 L = normalize(Lp - P);",
    "  vec3 V = vec3(0.0, 0.0, 1.0);",
    "  vec3 H = normalize(L + V);",
    "  float diff = max(dot(N, L), 0.0);",
    "  float spec = pow(max(dot(N, H), 0.0), 140.0);",
    "  float aniso = pow(max(dot(normalize(vec3(N.x * 0.25, N.y, N.z)), H), 0.0), 18.0);",
    "  float pool = exp(-dot(fc - u_light, fc - u_light) / (unit * unit * 0.55));",
    "  vec3 R = reflect(-V, N);",
    "  float env = 0.6 + 0.3 * R.y + 0.1 * R.x;",
    "  vec3 silver = vec3(0.78, 0.8, 0.835);",
    "  vec3 col = silver * (0.72 + 0.06 * mottle + 0.04 * brush) * (0.75 + 0.25 * env);",
    "  col *= 0.74 + 0.2 * diff + 0.16 * pool;",
    "  col += vec3(1.0, 0.99, 0.97) * (spec * 0.32 + aniso * 0.08 * pool);",
    // Grooves hold dark oxidised silver; the burin head throws a fresh glint.
    "  col = mix(col, vec3(0.13, 0.145, 0.2), cov * cut * 0.78);",
    "  float head = smoothstep(0.025, 0.0, abs(ord - u_engrave)) * cov * step(u_engrave, 0.999);",
    "  col += vec3(1.0, 0.97, 0.88) * head * 0.8;",

    // Set stones.
    "  for (int i = 0; i < 4; i++) {",
    "    vec3 st = u_stone[i];",
    "    float tt = u_stoneT[i];",
    "    if (tt <= 0.0) continue;",
    "    float bezA = smoothstep(0.0, 0.45, tt);",
    "    float gemA = smoothstep(0.35, 0.9, tt);",
    "    float r = st.z * (1.0 + 0.04 * u_hover[i]);",
    "    vec2 d = fc - st.xy;",
    "    float dist = length(d);",
    "    float bez = r * 1.17;",
    "    float px = 1.2;",
    // Drop shadow on the plate.
    "    float sh = smoothstep(bez * 1.32, bez * 0.92, length(d - vec2(r * 0.08, -r * 0.14)));",
    "    col *= 1.0 - 0.32 * sh * bezA;",
    // Granulation: a ring of silver beads around the bezel.
    "    float ang = atan(d.y, d.x);",
    "    float nb = floor(st.z * 0.42);",
    "    float ai = floor(ang / 6.28318 * nb + 0.5) * 6.28318 / nb;",
    "    float br = bez + r * 0.11;",
    "    vec2 bc = vec2(cos(ai), sin(ai)) * br;",
    "    float brad = r * 0.055 + 0.6;",
    "    vec2 bd = (d - bc) / brad;",
    "    float bead = 1.0 - smoothstep(1.0 - px / brad, 1.0, length(bd));",
    "    if (bead > 0.0) {",
    "      vec3 Nb = normalize(vec3(bd, sqrt(max(0.0, 1.0 - dot(bd, bd)))));",
    "      float sb = pow(max(dot(Nb, H), 0.0), 60.0);",
    "      vec3 bcCol = silver * (0.55 + 0.45 * max(dot(Nb, L), 0.0)) + sb * 0.9;",
    "      col = mix(col, bcCol, bead * bezA);",
    "    }",
    // Bezel: a rounded silver wire around the stone.
    "    float x = (dist - r) / (bez - r);",
    "    float ring = (1.0 - smoothstep(1.0 - px / (bez - r), 1.0, x)) * smoothstep(-px / (bez - r), 0.0, x);",
    "    if (ring > 0.0) {",
    "      vec2 rd = d / max(dist, 0.001);",
    "      vec3 Nr = normalize(vec3(rd * -cos(clamp(x, 0.0, 1.0) * 3.14159) * 1.6, 1.0));",
    "      float sr = pow(max(dot(Nr, H), 0.0), 80.0);",
    "      vec3 rc = vec3(0.86, 0.88, 0.9) * (0.5 + 0.5 * max(dot(Nr, L), 0.0)) + sr * 1.1;",
    "      col = mix(col, rc, ring * bezA);",
    "    }",
    // The cabochon itself.
    "    float inside = 1.0 - smoothstep(r - px, r, dist);",
    "    if (inside > 0.0) {",
    "      vec2 q = d / r;",
    "      float z = sqrt(max(0.0, 1.0 - dot(q, q)));",
    "      vec3 Ns = normalize(vec3(q * 0.95, z));",
    "      vec3 Ls = normalize(Lp - vec3(fc, r * 0.7));",
    "      vec3 Hs = normalize(Ls + V);",
    "      float ds = max(dot(Ns, Ls), 0.0);",
    "      float ss = pow(max(dot(Ns, Hs), 0.0), 90.0);",
    "      float fres = pow(1.0 - z, 3.0);",
    "      vec2 l2 = normalize(u_light - st.xy + 0.001);",
    "      float back = smoothstep(-0.2, 0.9, dot(q, -l2)) * (1.0 - length(q) * 0.4);",
    "      vec3 g = vec3(0.0);",
    "      vec2 seedOff = vec2(float(i) * 17.3, float(i) * 5.1);",
    "      if (i == 0) {",
    // Pounamu: deep green with milky clouds; light glows through the far side.
    "        float n = fbm3(q * 1.6 + seedOff);",
    "        float w = fbm3(vec2(q.x * 1.2, q.y * 6.0) + seedOff + n);",
    "        g = mix(vec3(0.02, 0.12, 0.07), vec3(0.12, 0.42, 0.24), smoothstep(-0.5, 0.6, n));",
    "        g = mix(g, vec3(0.55, 0.72, 0.58), smoothstep(0.2, 0.8, w) * 0.3);",
    "        g = g * (0.55 + 0.45 * ds) + vec3(0.25, 0.9, 0.5) * back * 0.45;",
    "      } else if (i == 1) {",
    // Turquoise: opaque blue-green with a dark web of matrix.
    "        vec3 v = voronoi(q * 3.2 + seedOff + fbm3(q * 2.0) * 0.6);",
    "        float n = fbm3(q * 2.2 + seedOff);",
    "        g = mix(vec3(0.16, 0.56, 0.55), vec3(0.42, 0.8, 0.76), smoothstep(-0.5, 0.6, n));",
    "        float vein = 1.0 - smoothstep(0.015, 0.05 + 0.03 * n, v.y);",
    "        g = mix(g, vec3(0.2, 0.15, 0.1), vein * 0.85);",
    "        g *= 0.6 + 0.45 * ds;",
    "      } else if (i == 2) {",
    // Amber: warm, translucent, with a small insect suspended inside.
    "        float n = fbm3(q * 1.8 + seedOff);",
    "        g = mix(vec3(0.42, 0.12, 0.01), vec3(0.98, 0.6, 0.12), smoothstep(-0.2, 1.0, back + 0.3 * n + 0.35 * z));",
    "        g += vec3(1.0, 0.75, 0.3) * back * 0.35;",
    "        vec3 bub = voronoi(q * 9.0 + seedOff);",
    "        g += vec3(1.0, 0.85, 0.5) * (1.0 - smoothstep(0.0, 0.06, bub.x)) * step(0.8, bub.z) * 0.6;",
    "        float aa = 1.5 / r;",
    "        float wg = 1.0 - smoothstep(-aa, aa, wings(q));",
    "        g = mix(g, g * 0.7 + vec3(0.25, 0.18, 0.1), wg * 0.35);",
    "        float bug = 1.0 - smoothstep(-aa, aa, insect(q));",
    "        g = mix(g, vec3(0.1, 0.035, 0.005), bug * 0.92);",
    "        g *= 0.75 + 0.3 * ds;",
    "      } else {",
    // Black opal: play-of-colour patches that shift as the light or phone moves.
    "        float n = fbm3(q * 3.0 + seedOff);",
    "        vec3 v = voronoi(q * 4.6 + seedOff + vec2(n, fbm3(q * 2.0 - seedOff)) * 0.9);",
    "        float hue = v.z * 2.0 + dot(Ns.xy, l2) * 0.8 + u_tilt * 0.9 + n * 0.3;",
    "        float flash = smoothstep(0.45, 0.95, sin(6.28318 * (v.z * 3.0 + dot(Ns.xy, l2) * 1.4 + u_tilt * 1.2)) * 0.5 + 0.5);",
    "        flash *= smoothstep(0.0, 0.12, v.y + 0.02);",
    "        g = vec3(0.04, 0.06, 0.11) + mix(vec3(0.5), spectrum(hue), 0.85) * flash * (0.6 + 0.35 * ds);",
    "        g += spectrum(hue + 0.3) * 0.12 * (1.0 - flash);",
    "      }",
    "      g += vec3(1.0) * ss * 1.15 + vec3(0.9, 0.95, 1.0) * fres * 0.18;",
    "      g *= 1.0 + 0.12 * u_hover[i];",
    "      col = mix(col, g, inside * gemA);",
    "    }",
    "  }",

    "  col *= 1.0 - 0.18 * pow(length((uv - 0.5) * vec2(1.0, 1.2)), 2.4);",
    "  col += (hash(fc + fract(u_time)) - 0.5) / 255.0;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var gl, prog, tex, loc = {};
  var scale = 1;
  var running = false, visible = true, raf = 0;
  var startTime = 0, lastFrame = 0, isSet = false;
  var stones = [], stoneEls = {};
  var light = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  var lastPointer = -1e9, tilt = 0, tiltTarget = 0;
  var hover = [0, 0, 0, 0], hoverTarget = [0, 0, 0, 0];
  var engr = document.createElement("canvas");

  Array.prototype.forEach.call(hero.querySelectorAll(".stone"), function (el) { stoneEls[el.dataset.stone] = el; });

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("Plate shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function init() {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
    if (!gl) return false;
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
    ["u_engr", "u_res", "u_texel", "u_time", "u_engrave", "u_light", "u_tilt", "u_stone", "u_stoneT", "u_hover"].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(loc.u_engr, 0);
    return true;
  }

  function baseScale() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    return dpr * (window.innerWidth < 800 ? 0.75 : 0.85);
  }

  /* ---------- Layout: read where the DOM stones sit ---------- */
  function measure() {
    var cr = canvas.getBoundingClientRect();
    var k = canvas.width / Math.max(1, cr.width);
    stones = ORDER.map(function (name) {
      var el = stoneEls[name];
      if (!el) return { x: -999, y: -999, r: 0, cssX: -999, cssY: -999, cssR: 0 };
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2 - cr.left;
      var cy = r.top + r.height / 2 - cr.top;
      return { x: cx * k, y: (cr.height - cy) * k, r: (r.width / 2) * k, cssX: cx, cssY: cy, cssR: r.width / 2 };
    });
  }

  /* ---------- Engraving: drawn once, order encoded in the green channel ---------- */
  function buildEngraving() {
    var W = canvas.clientWidth, H = canvas.clientHeight;
    var k = canvas.width / Math.max(1, W);
    engr.width = canvas.width;
    engr.height = canvas.height;
    var ctx = engr.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, engr.width, engr.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var small = W < 700;
    var heroRect = hero.getBoundingClientRect();
    var keepOut = [];
    var copy = hero.querySelector(".hero__copy");
    if (copy) {
      var c = copy.getBoundingClientRect();
      keepOut.push({ l: c.left - heroRect.left - 14, t: c.top - heroRect.top - 14, r: c.right - heroRect.left + 14, b: c.bottom - heroRect.top + 14 });
    }
    stones.forEach(function (s) {
      var el = stoneEls[ORDER[stones.indexOf(s)]];
      var label = el && el.querySelector(".stone__label");
      if (label) {
        var lr = label.getBoundingClientRect();
        keepOut.push({ l: lr.left - heroRect.left - 12, t: lr.top - heroRect.top - 10, r: lr.right - heroRect.left + 12, b: lr.bottom - heroRect.top + 10 });
      }
    });
    function blocked(x, y) {
      for (var i = 0; i < keepOut.length; i++) {
        var o = keepOut[i];
        if (x > o.l && x < o.r && y > o.t && y < o.b) return true;
      }
      return false;
    }

    var tracks = [[], [], [], []];
    var frame = null; // inner edge of the border band, set below
    function outside(x, y) { return frame && (x < frame.l || x > frame.r || y < frame.t || y > frame.b); }
    function seg(track, x1, y1, x2, y2, w) {
      if (blocked(x1, y1) || blocked(x2, y2) || blocked((x1 + x2) / 2, (y1 + y2) / 2)) return;
      if (track > 0 && (outside(x1, y1) || outside(x2, y2))) return;
      tracks[track].push([x1, y1, x2, y2, w || 1.4]);
    }
    function poly(track, pts, w, closed) {
      for (var i = 0; i < pts.length - 1; i++) seg(track, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w);
      if (closed) seg(track, pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], w);
    }
    function circle(track, cx, cy, r, w, n) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push([cx + Math.cos(i / n * Math.PI * 2) * r, cy + Math.sin(i / n * Math.PI * 2) * r]);
      poly(track, pts, w, true);
    }

    // Track 0: a border band of triangles below the header and around the plate.
    var topBar = document.querySelector("[data-top]");
    var topH = topBar ? topBar.getBoundingClientRect().height : 70;
    var m1 = small ? 8 : 20, m2 = small ? 16 : 32;
    var top1 = topH + (small ? 6 : 10), top2 = top1 + (m2 - m1);
    var bot1 = H - m1, bot2 = H - m2;
    poly(0, [[m1, top1], [W - m1, top1], [W - m1, bot1], [m1, bot1]], 1.3, true);
    poly(0, [[m2, top2], [W - m2, top2], [W - m2, bot2], [m2, bot2]], 1.3, true);
    var step = small ? 12 : 16, gap = m2 - m1, n = 0;
    for (var x = m2; x + step <= W - m2; x += step, n++) {
      poly(0, [[x, top2], [x + step / 2, top1 + 2], [x + step, top2]], 1.1);
      if (n % 2) seg(0, x + step / 2, top2, x + step / 2, top1 + 3, 1.1);
    }
    for (var y = top2; y + step <= bot2; y += step, n++) {
      poly(0, [[W - m2, y], [W - m1 - 2, y + step / 2], [W - m2, y + step]], 1.1);
      if (n % 2) seg(0, W - m2, y + step / 2, W - m1 - 3, y + step / 2, 1.1);
    }
    for (x = W - m2; x - step >= m2; x -= step, n++) {
      poly(0, [[x, bot2], [x - step / 2, bot1 - 2], [x - step, bot2]], 1.1);
      if (n % 2) seg(0, x - step / 2, bot2, x - step / 2, bot1 - 3, 1.1);
    }
    for (y = bot2; y - step >= top2; y -= step, n++) {
      poly(0, [[m2, y], [m1 + 2, y - step / 2], [m2, y - step]], 1.1);
      if (n % 2) seg(0, m2, y - step / 2, m1 + 3, y - step / 2, 1.1);
    }
    void gap;
    frame = { l: m2 + 6, r: W - m2 - 6, t: top2 + 6, b: bot2 - 6 };

    // Track 1: nested lozenges around the stones, with chevrons and dots.
    var cx = 0, cy = 0, A = 0, R = 0;
    stones.forEach(function (s) { cx += s.cssX / 4; cy += s.cssY / 4; R += s.cssR / 4; });
    stones.forEach(function (s) { A += Math.hypot(s.cssX - cx, s.cssY - cy) / 4; });
    function diamond(d) { return [[cx, cy - d], [cx + d, cy], [cx, cy + d], [cx - d, cy]]; }
    var d1 = A + R * 2.1, d2 = d1 + (small ? 9 : 13), d3 = d2 + (small ? 12 : 18);
    poly(1, diamond(d1), 1.4, true);
    poly(1, diamond(d2), 1.4, true);
    var D1 = diamond(d1), D2 = diamond(d2);
    for (var side = 0; side < 4; side++) {
      var a1 = D1[side], b1 = D1[(side + 1) % 4], a2 = D2[side], b2 = D2[(side + 1) % 4];
      var len = Math.hypot(b1[0] - a1[0], b1[1] - a1[1]);
      var count = Math.floor(len / (small ? 6 : 7));
      for (var i = 1; i < count; i++) {
        var t0 = i / count, t1 = Math.min(1, (i + 0.9) / count);
        seg(1, a1[0] + (b1[0] - a1[0]) * t0, a1[1] + (b1[1] - a1[1]) * t0, a2[0] + (b2[0] - a2[0]) * t1, a2[1] + (b2[1] - a2[1]) * t1, 1.0);
      }
    }
    var D3 = diamond(d3);
    for (side = 0; side < 4; side++) {
      var a3 = D3[side], b3 = D3[(side + 1) % 4];
      var l3 = Math.hypot(b3[0] - a3[0], b3[1] - a3[1]), c3 = Math.floor(l3 / 10);
      for (i = 0; i <= c3; i++) {
        var px = a3[0] + (b3[0] - a3[0]) * i / c3, py = a3[1] + (b3[1] - a3[1]) * i / c3;
        seg(1, px - 0.3, py, px + 0.3, py, 2.6);
      }
    }
    // The cross at the centre: a small hatched diamond and arms out to each stone.
    var d0 = A * 0.28;
    poly(1, diamond(d0), 1.3, true);
    for (i = 1; i < 5; i++) {
      var f = i / 5;
      seg(1, cx - d0 + d0 * f, cy - d0 * f, cx + d0 * f, cy + d0 - d0 * f, 0.9);
    }
    stones.forEach(function (s) {
      var dx = s.cssX - cx, dy = s.cssY - cy, L = Math.hypot(dx, dy) || 1;
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var from = d0 * 1.02, to = L - s.cssR * 1.62;
      if (to <= from) return;
      seg(1, cx + ux * from + nx * 4, cy + uy * from + ny * 4, cx + ux * to + nx * 4, cy + uy * to + ny * 4, 1.2);
      seg(1, cx + ux * from - nx * 4, cy + uy * from - ny * 4, cx + ux * to - nx * 4, cy + uy * to - ny * 4, 1.2);
      for (var r = from + 6; r < to; r += 7) seg(1, cx + ux * r + nx * 4, cy + uy * r + ny * 4, cx + ux * r - nx * 4, cy + uy * r - ny * 4, 0.9);
    });

    // Track 2: engraved circles around each bezel.
    stones.forEach(function (s) {
      circle(2, s.cssX, s.cssY, s.cssR * 1.42, 1.2, 64);
      circle(2, s.cssX, s.cssY, s.cssR * 1.52, 1.0, 64);
    });

    // Encode cut order: tracks run in parallel windows of the 0..1 timeline.
    var windows = [[0, 0.95], [0.04, 0.78], [0.38, 0.5], [0, 1]];
    tracks.forEach(function (list, ti) {
      var total = 0;
      list.forEach(function (sg) { total += Math.hypot(sg[2] - sg[0], sg[3] - sg[1]) + 2; });
      var run = 0;
      list.forEach(function (sg) {
        run += Math.hypot(sg[2] - sg[0], sg[3] - sg[1]) + 2;
        var o = windows[ti][0] + windows[ti][1] * (run / Math.max(1, total));
        ctx.strokeStyle = "rgb(255," + Math.min(255, Math.round(o * 255)) + ",0)";
        ctx.lineWidth = sg[4] * k;
        ctx.beginPath();
        ctx.moveTo(sg[0] * k, sg[1] * k);
        ctx.lineTo(sg[2] * k, sg[3] * k);
        ctx.stroke();
      });
    });

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, engr);
  }

  function resize() {
    var w = Math.max(1, Math.round(canvas.clientWidth * scale));
    var h = Math.max(1, Math.round(canvas.clientHeight * scale));
    canvas.width = w;
    canvas.height = h;
    measure();
    buildEngraving();
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Idle light: circles above and to the left of the stones, so every stone catches it.
  function drift(t) {
    var cx = 0, cy = 0, A = 0;
    stones.forEach(function (s) { cx += s.x / 4; cy += s.y / 4; });
    stones.forEach(function (s) { A += Math.hypot(s.x - cx, s.y - cy) / 4; });
    A = A || canvas.height * 0.25;
    return { x: cx - A * 1.05 + Math.sin(t * 0.27) * A * 0.75, y: cy + A * 0.95 + Math.sin(t * 0.37 + 0.8) * A * 0.5 };
  }

  function draw(t) {
    var engrave = easeInOut(clamp01((t - 0.2) / 2.8));
    var stoneT = SET_ORDER.map(function (_, i) { return clamp01((t - 2.1 - i * 0.42) / 0.9); });
    if (reduceMotion) { engrave = 1; stoneT = [1, 1, 1, 1]; }
    var tArr = new Float32Array(4), sArr = new Float32Array(12);
    ORDER.forEach(function (name, i) {
      tArr[i] = stoneT[SET_ORDER.indexOf(name)];
      sArr[i * 3] = stones[i].x;
      sArr[i * 3 + 1] = stones[i].y;
      sArr[i * 3 + 2] = stones[i].r;
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform2f(loc.u_res, canvas.width, canvas.height);
    gl.uniform2f(loc.u_texel, 1 / canvas.width, 1 / canvas.height);
    gl.uniform1f(loc.u_time, t);
    gl.uniform1f(loc.u_engrave, engrave);
    gl.uniform2f(loc.u_light, light.x, light.y);
    gl.uniform1f(loc.u_tilt, tilt);
    gl.uniform3fv(loc.u_stone, sArr);
    gl.uniform1fv(loc.u_stoneT, tArr);
    gl.uniform1fv(loc.u_hover, new Float32Array(hover));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!isSet && (tArr.every(function (v) { return v >= 1; }) || reduceMotion)) {
      isSet = true;
      hero.dataset.state = "set";
    }
  }

  // The light sweeps in from the top left before settling into its drift.
  function introLight(t) {
    var d = drift(t);
    var k = easeOut(clamp01(t / 3.2));
    return { x: -canvas.width * 0.15 + (d.x + canvas.width * 0.15) * k, y: canvas.height * 1.15 + (d.y - canvas.height * 1.15) * k };
  }

  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    var t = freezeAt >= 0 ? freezeAt : (now - startTime) / 1000;
    var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
    lastFrame = now;

    var idle = now - lastPointer > 3000;
    if (idle) target = t < 3.2 ? introLight(t) : drift(t);
    var kk = 1 - Math.exp(-dt * (idle ? (t < 3.2 ? 30 : 1.5) : 8));
    light.x += (target.x - light.x) * kk;
    light.y += (target.y - light.y) * kk;
    if (idle) tiltTarget = Math.sin(t * 0.21) * 0.4;
    tilt += (tiltTarget - tilt) * (1 - Math.exp(-dt * 4));
    for (var i = 0; i < 4; i++) hover[i] += (hoverTarget[i] - hover[i]) * (1 - Math.exp(-dt * 10));

    draw(t);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function renderStill() {
    var d = drift(1.5);
    light.x = target.x = d.x;
    light.y = target.y = d.y;
    draw(20);
  }

  function pointerTo(event) {
    var r = canvas.getBoundingClientRect();
    var k = canvas.width / Math.max(1, r.width);
    target.x = (event.clientX - r.left) * k;
    target.y = (r.height - (event.clientY - r.top)) * k;
    tiltTarget = ((event.clientX - r.left) / r.width - 0.5) * 1.6;
    lastPointer = performance.now();
    if (reduceMotion) {
      light.x = target.x;
      light.y = target.y;
      tilt = tiltTarget;
      draw(20);
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
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null) return;
    tiltTarget = Math.max(-1, Math.min(1, e.gamma / 35));
    lastPointer = performance.now() - 2000;
  });

  ORDER.forEach(function (name, i) {
    var el = stoneEls[name];
    if (!el) return;
    var on = function () { hoverTarget[i] = 1; if (reduceMotion) { hover[i] = 1; draw(20); } };
    var off = function () { hoverTarget[i] = 0; if (reduceMotion) { hover[i] = 0; draw(20); } };
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on);
    el.addEventListener("blur", off);
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
    if (reduceMotion) renderStill(); else start();
  });

  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduceMotion || !running) renderStill();
    }, 120);
  }
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener("resize", onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

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
    if (document.hidden) running = false;
    else start();
  });

  startTime = performance.now();
  var l0 = introLight(0);
  light.x = target.x = l0.x;
  light.y = target.y = l0.y;
  start();
})();
