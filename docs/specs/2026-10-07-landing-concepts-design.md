# Jewellery of the Earth: two landing-page concepts

Date: 2026-10-07 · Status: built; luxury refinement pass and scroll motion pass (2026-10-09) applied at the user's request

## Context

- Client: Jewellery of the Earth (Instagram @jewelleryoftheearth, Etsy JEWELLERYOFTHEEARTH, run by "Johnnie").
- Bio: "showcases the largest and finest collection of hand carved pounamu outside of New Zealand in London's Camden Lock Market."
- Materials seen: pounamu (koru, hei matau, pikorua, toki, tiki), Tuareg silver and turquoise, amber (one piece with an insect inclusion), opal, moonstone, labradorite, carved bone, carved-gemstone wolf heads, amethyst, quartz.
- Etsy: 220 sales, 4.5 stars, currently not selling. Business is moving online-only; the Camden stall becomes heritage.
- Assets: no logo (we design wordmarks). Only 12 Instagram photos, 640px, heavy 2014 filters.

## Goal

Two visually distinct, high-impact demo landing pages the client chooses between. Wow factor lives in an animated hero rooted in the jewellery's history. If chosen, the page later becomes a full e-commerce build on a different stack.

## Constraints

- HTML, CSS and vanilla JavaScript only. Hand-written WebGL and Canvas are allowed; no libraries.
- No backend. Commerce actions are visual only ("Add to bag" shows a "shop opens soon" notice; sign-up form validates locally and confirms).
- Static files, opens from a local server or any static host.

## File structure

```
index.html                  chooser between the two concepts
shared/fonts/               self-hosted woff2 (latin + latin-ext for macrons)
shared/img/                 resized, colour-graded Instagram photos
design-a/index.html         Concept A
design-a/style.css
design-a/hero.js            WebGL stone shader
design-a/main.js            forms picker, notices, sign-up
design-b/index.html         Concept B
design-b/style.css
design-b/hero.js            WebGL silver plate + four stones
design-b/main.js            stone hover/click, notices, sign-up
tools/process_images.py     reproducible image processing
```

## Concept A: "Held to the light"

Story: pounamu, the client's signature. The most characteristic act is holding greenstone up to the light.

Hero (one orchestrated sequence, about 3 s):
1. Full-bleed grey-brown river boulder rind (noise texture).
2. A jagged cut line sweeps across; the rind recedes from the cut, revealing polished green pounamu with milky īnanga streaks and dark flecks.
3. Pointer (or touch, or a slow idle drift) is a light source behind the stone: translucent glow and polish highlights follow it.
4. Headline set in Commissioner; the FLAR axis animates 0 → 100 as the stone opens so the letters become "carved".

Sections: hero; gift tradition ("given, not bought for yourself"); the forms picker (koru, hei matau, pikorua, toki, roimata; choosing one draws its SVG outline and shows its meaning); other treasures of the earth (amber, turquoise, opal, bone with photos); from Camden Lock (heritage, stall photos); launch sign-up; footer.

Tokens: Kawakawa #0E3426, Īnanga #D3E0D0, Riverstone #5F6C6A, Tōtara #7A5233, Glow #8EF0B4 (only where light passes through). Type: Commissioner (variable wght, FLAR, VOLM) for everything. Left-aligned text.

## Concept B: "Four corners of the world"

Story: the Tuareg saying spoken when a father gives his son the Agadez cross, "I give you the four corners of the world, because no one knows where they will die." The collection came from four corners of the earth to one stall.

Hero (one orchestrated sequence, about 4 s):
1. Matte silver plate fills the screen; geometric engraving is cut into it line by line (drawn into an offscreen canvas used as a height map).
2. Four bezel-set cabochons appear in turn: pounamu (mottled green), turquoise (blue-green with dark matrix web), amber (warm glow, tiny insect inclusion), opal (play-of-colour that shifts with pointer or device tilt).
3. Pointer is a raking light: engraving glints, each stone reacts differently. Hovering a stone names its origin; clicking scrolls to its chapter. Stones are also real buttons in the DOM for keyboard and screen readers.

Sections: hero; the saying explained; four chapters (pounamu / Aotearoa, silver and turquoise / Sahara, amber / Baltic coast, opal / outback), each a full-width band in its stone colour with origin coordinates, short history, photo and shop link; "every road led to Camden Lock" heritage; featured pieces; launch sign-up; footer.

Tokens: Silver #D6DADF (page), Indigo #1C2449 (text), Pounamu #2F6B4F, Turquoise #2BA39A, Amber #D9861C, opal drawn iridescent. Type: Bodoni Moda (display), Schibsted Grotesk (body).

## Shared rules

- Hero text is real HTML above the canvas; canvas is aria-hidden.
- prefers-reduced-motion: render a single finished frame, no sequence, no idle drift.
- No WebGL: CSS gradient fallback that still reads as the material.
- Render resolution capped (DPR ≤ 1.5); animation pauses when the hero is off-screen or the tab is hidden.
- Responsive to 360px wide, 16px side gutters minimum, no horizontal scroll; touch replaces pointer.
- Visible keyboard focus everywhere.
- No numbered section markers, no ALL-CAPS eyebrow labels. Motion outside the hero responds to the visitor (scrolling, pointer, clicks); see the scroll motion pass below.
- Te reo Māori words carry macrons. Sourcing claims stay neutral (no "authenticated" or iwi claims unless confirmed).
- Prices are placeholders.

## Verification

- Load both pages and the chooser in a browser at 1440×900 and 390×844; screenshot and review.
- No console errors on either page.
- Reduced-motion emulation shows the static frame.
- Keyboard: tab through nav, hero CTAs, stones (B), forms picker (A), sign-up.

## Open questions for the client

- Where does their opal come from? (B assumes Australia.)
- Is any pounamu sourced through Ngāi Tahu-authorised channels, and who carved it? (Copy stays neutral until known.)
- How long did the Camden Lock stall trade? (Copy avoids a year.)

## Luxury refinement (requested after first build)

- Sharp-cornered buttons in small spaced capitals; wordmarks in spaced capitals; "Bag (0)" instead of a badge.
- Product cards: quiet "Add to bag" text links instead of buttons.
- One photo grade per concept (A darker and moodier, B cooler).
- A: a single gold hairline accent (#C2A46E), portrait image crops with an offset gold outline (pebble masks dropped), more space.
- B: chapters alternate deep indigo and pale silver; stone colour appears only in the gem and the chapter title.

## Scroll motion pass (2026-10-09)

The user asked for scroll animations, more exciting sections and an eye-catching chooser. Each concept's scroll motion borrows its own hero's language rather than generic fade-ups.

`shared/motion.js` is a small scroll engine: one requestAnimationFrame loop that runs only while the page moves, reads every nearby scene's position before any scene writes, and adds `html.motion` only when reduced motion is off. All hidden start states live under `.motion`, so without JS or with reduced motion every scene shows its finished state.

Concept A (`design-a/scroll.js`, forms in `main.js`): cut, carve, light through stone.
- Hero: scrolling away pushes the view into the stone (`u_scroll` in the shader) while the copy falls behind.
- Headings are cut open along the hero's diagonal and carved (FLAR 0 to 100). The gift headline is carved word by word with scroll.
- Gift: a toki is lowered on its cord, turns as the page moves, sways with scroll speed and swings if the pointer brushes it.
- Forms: a pinned stage across a tall track; each form's gold outline is traced, the jade fills in, then light comes through. The picker marker glides between names; buttons and arrow keys jump to a form.
- Collection: a light travels behind the plinths and each stone glows as it passes.
- Treasures: photos split open along the hero's cut with a seam of green light; columns drift at different depths.
- Story: the stall photographs drift past in a row (swipeable row under reduced motion).
- Sign-up: a koru frond (new beginnings) unfurls with a point of light at its tip.

Concept B (`design-b/scroll.js`): engrave, set, travel.
- Hero: the raking light lowers as you scroll away, so the engraving glints.
- Headings are cut in outline, then inked.
- Saying: an engraved silver globe (Canvas 2D, graticule only) sits beside the text and draws a route from Camden Lock to each stone in order of distance, ending on the one view that keeps all four in sight. The key below counts each distance up.
- Chapters: photos appear through engraving lines that thicken until solid; the stone is pressed into its bezel and glints; coordinates count up; opal's colour plays as you scroll past.
- Story: four roads in the stone colours run from the page corners and each stone sets itself into a corner of the stall photo.
- Pieces: a raking light passes across each photo in turn.
- Sign-up: the Agadez cross is engraved line by line.

Chooser (`index.html`, `chooser.js`): one WebGL canvas shows pounamu and engraved silver meeting at a jagged seam. A crack of light draws down the seam on arrival and both materials open from it; the pointer is a light for both; hovering a side widens it and the seam follows the panel edge. A's title is carved and B's is engraved then inked. On narrow screens the seam is horizontal. CSS gradient fallback without WebGL.
