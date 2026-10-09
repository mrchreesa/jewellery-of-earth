# Jewellery of the Earth landing concepts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two static demo landing pages (Concept A "Held to the light", Concept B "Four corners of the world") plus a chooser page.

**Architecture:** Plain static files. Each concept is its own folder with `index.html`, `style.css`, `hero.js` (self-contained WebGL hero with CSS fallback) and `main.js` (page interactions). Shared fonts and processed photos live in `shared/`.

**Tech Stack:** HTML, CSS, vanilla JS, raw WebGL 1. Python + Pillow only for the offline image script. Playwright MCP for verification.

**Spec:** `docs/specs/2026-10-07-landing-concepts-design.md`

## Global Constraints

- No JS or CSS libraries; no build step.
- Fonts self-hosted woff2 with latin + latin-ext subsets (macrons ā ē ī ō ū must render).
- `prefers-reduced-motion: reduce` → hero renders one finished frame, no sequence, no idle drift.
- No WebGL → CSS fallback hero, page still complete.
- DPR capped at 1.5; render loop stops when hero off-screen or tab hidden.
- Works at 360px wide, ≥16px gutters, no horizontal scroll.
- No numbered section markers, no ALL-CAPS eyebrow labels, no motion outside the hero unless the visitor triggered it.
- Commerce is visual only: "Add to bag" → notice "The online shop opens soon. Join the list to hear first."
- Copy keeps sourcing claims neutral; prices are placeholders.

## Review Focus

1. Touch devices (no hover): hero light must follow touch and idle-drift; B's stone labels must be reachable by tap and keyboard. Check with 390×844 emulation.
2. WebGL context failure or lost context: fallback class `.no-gl` on `<html>` shows CSS hero. Check by forcing `getContext` to return null.
3. Very wide (2560px) and very short (≤600px tall) viewports: hero copy must not overlap the nav or be cut off. Check at 2560×1100 and 1280×600.
4. Opening `index.html` via `file://`: no fetch/XHR or ES module imports, so pages work without a server. Scripts are classic `defer` scripts.
5. Sign-up with an empty or malformed email: native validation message, no false success.

---

### Task 1: Shared assets and chooser

**Files:**
- Create: `tools/process_images.py`, `shared/img/*.jpg`, `shared/fonts/*.woff2`, `index.html`

**Interfaces:**
- Produces: `shared/img/{wolves,quartz,amethyst,bone,amber,rings-labradorite,stall-pounamu,ring-tray,heishi,pounamu-wall,moonstone,amber-turquoise}.jpg` (640px, graded), font files `commissioner-var-{latin,latin-ext}.woff2`, `bodoni-moda-var-{latin,latin-ext}.woff2`, `bodoni-moda-italic-var-{latin,latin-ext}.woff2`, `schibsted-grotesk-var-{latin,latin-ext}.woff2`.

- [ ] Step 1: Copy the 12 downloaded Instagram images from the scratchpad into `tools/source/` with descriptive names.
- [ ] Step 2: Write `tools/process_images.py` (Pillow): reduce the 2014 filter cast (auto-contrast with 1% cutoff, saturation 0.92), save progressive JPEG q82 to `shared/img/`.
- [ ] Step 3: Download woff2 files from the Google Fonts CSS API (latin and latin-ext blocks only) into `shared/fonts/`.
- [ ] Step 4: Build `index.html` chooser: two full-height panels linking to `design-a/` and `design-b/`, each previewing its palette and type.
- [ ] Step 5: Verify: open chooser at 1440×900 and 390×844, screenshot, no console errors, fonts load (document.fonts.check).

### Task 2: Concept A page (structure, copy, CSS fallback hero)

**Files:**
- Create: `design-a/index.html`, `design-a/style.css`

**Interfaces:**
- Produces DOM hooks for later tasks: `<canvas id="stone" aria-hidden="true">` inside `.hero`; `<html class="js">` toggled by inline script; `.hero[data-state]` (`"rind" | "open"`); `.forms` with `button[data-form]` (`koru|hei-matau|pikorua|toki|roimata`) and `svg#form-art`, `#form-name`, `#form-meaning`; `[data-add-to-bag]` buttons; `form#signup`; `#notice` live region.

- [ ] Step 1: Write semantic HTML with all copy: header/nav, hero, gift tradition, forms picker, other treasures, from Camden Lock, sign-up, footer.
- [ ] Step 2: Write CSS tokens (Kawakawa #0E3426, Īnanga #D3E0D0, Riverstone #5F6C6A, Tōtara #7A5233, Glow #8EF0B4), type scale, layout, CSS fallback hero gradient, focus styles, reduced-motion rules.
- [ ] Step 3: Verify at 1440×900 and 390×844: screenshot, `document.documentElement.scrollWidth <= innerWidth`, macrons render in Commissioner.

### Task 3: Concept A hero shader

**Files:**
- Create: `design-a/hero.js`

**Interfaces:**
- Consumes: `#stone`, `.hero`.
- Produces: sets `.hero[data-state="open"]` when the cut finishes (CSS uses it to animate the headline's `font-variation-settings` FLAR 0 → 100); adds `html.no-gl` on failure.

- [ ] Step 1: WebGL setup: full-screen triangle, uniforms `u_res`, `u_time`, `u_reveal` (0..1), `u_light` (vec2, px), `u_lightOn`.
- [ ] Step 2: Fragment shader: fbm/domain-warped pounamu (deep green base, īnanga streaks, dark flecks), rind (grey-brown speckled noise), jagged cut line, rind recedes from cut as `u_reveal` rises, translucency glow around light, specular polish from noise normals.
- [ ] Step 3: Pointer/touch → eased light position; idle drift when no pointer; reduced motion → single frame at reveal 1; IntersectionObserver + visibilitychange pause; DPR cap 1.5; context-loss handling.
- [ ] Step 4: Verify: screenshot mid-reveal and after; pixel sample of canvas is non-blank; reduced-motion emulation gives the open frame; forced no-GL shows fallback.

### Task 4: Concept A interactions

**Files:**
- Create: `design-a/main.js`

**Interfaces:**
- Consumes: `.forms button[data-form]`, `svg#form-art`, `#form-name`, `#form-meaning`, `[data-add-to-bag]`, `form#signup`, `#notice`.
- Produces: `showNotice(text)` (module-local).

- [ ] Step 1: Forms data (name, te reo name, meaning, SVG path) and picker with roving `aria-pressed`; selecting redraws the outline with stroke-dash animation (skipped under reduced motion).
- [ ] Step 2: Add-to-bag notice and sign-up handler (native validation, success message replaces form).
- [ ] Step 3: Verify keyboard flow through picker and sign-up; empty-email shows validation, valid email shows success.

### Task 5: Concept B page (structure, copy, CSS fallback hero)

**Files:**
- Create: `design-b/index.html`, `design-b/style.css`

**Interfaces:**
- Produces: `<canvas id="plate" aria-hidden="true">` in `.hero`; `.stones` with four `button.stone[data-stone]` (`pounamu|turquoise|amber|opal`) absolutely positioned over the canvas and linking to `#ch-<stone>`; each has `.stone__label`; chapters `section#ch-pounamu` etc.; `[data-add-to-bag]`, `form#signup`, `#notice`.

- [ ] Step 1: Semantic HTML with all copy: header, hero with saying and attribution, the saying explained, four chapters with coordinates, Camden Lock heritage, featured pieces, sign-up, footer.
- [ ] Step 2: CSS tokens (Silver #D6DADF, Indigo #1C2449, Pounamu #2F6B4F, Turquoise #2BA39A, Amber #D9861C), Bodoni Moda + Schibsted Grotesk scale, chapter bands, CSS fallback plate and stones, focus styles.
- [ ] Step 3: Verify at 1440×900 and 390×844 as in Task 2.

### Task 6: Concept B hero shader

**Files:**
- Create: `design-b/hero.js`

**Interfaces:**
- Consumes: `#plate`, `.stone` buttons (reads their centres and radius from `getBoundingClientRect` so DOM and GL stay aligned).
- Produces: sets `.hero[data-state="set"]` after the fourth stone lands (CSS reveals labels/buttons); `html.no-gl` on failure.

- [ ] Step 1: Offscreen 2D canvas engraving: deterministic geometric Tuareg-style pattern (bands of chevrons, triangles, dot rows, cross-hatching), drawn progressively and uploaded as a texture during the sequence.
- [ ] Step 2: Fragment shader: brushed matte silver with normals from the engraving height map, raking light from pointer; four bezel-set cabochons with dome normals and per-stone materials (pounamu fbm, turquoise voronoi matrix, amber glow + insect silhouette, opal play-of-colour driven by view/pointer); per-stone appear progress `u_stoneT[4]`.
- [ ] Step 3: Pointer/touch/device-orientation light, idle drift, reduced motion single frame, pause off-screen, DPR cap, resize keeps stones aligned with buttons, context loss.
- [ ] Step 4: Verify as in Task 3, plus stones line up with their buttons at both viewport sizes.

### Task 7: Concept B interactions

**Files:**
- Create: `design-b/main.js`

**Interfaces:**
- Consumes: `.stone`, chapters, `[data-add-to-bag]`, `form#signup`, `#notice`.

- [ ] Step 1: Stone hover/focus shows origin label; click scrolls to chapter (smooth unless reduced motion).
- [ ] Step 2: Add-to-bag notice and sign-up handler.
- [ ] Step 3: Verify keyboard reaches all four stones, and the sign-up behaviour matches Task 4.

### Task 8: Final review pass

- [ ] Step 1: Run every Review Focus check on both concepts.
- [ ] Step 2: Screenshot each page at 1440×900 and 390×844; critique against the spec and fix.
- [ ] Step 3: Remove `.playwright-mcp/` scratch output from the project folder.
