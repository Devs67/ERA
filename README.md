# Experion Robotics Academy — Curriculum Map

A static, single-page curriculum map for a Grade 1–9 STEM programme. No build step, no dependencies, no framework. Open `index.html` and it runs.

## What's in it

Four tabs:

| Tab | Contents |
|---|---|
| **Curriculum** | Four views: the 8 × 9 strand ladder, a by-grade view (strands running plus all 61 modules), the Grades 5–9 technology stack, and the toolkit |
| **Deployment** | Two engagement models, phased rollout, and what the school needs to provide |
| **In the classroom** | Setup sequence and the three-beat module rhythm |

The page opens on a brand story, not on data. No section panel is open until a visitor picks one.

## Files

```
index.html                 markup only — no inline styles or scripts
assets/css/styles.css      layout, colour, typography
assets/css/motion.css      all animation, and the reduced-motion switch-off
assets/js/data.js          all curriculum content — edit this to change the site
assets/js/app.js           rendering and interaction logic
```

The split is deliberate: **`data.js` holds every piece of curriculum content and no logic.** To add a module, change a tool, or fix a typo, you only ever open that file.

## Editing the content

All content lives in `assets/js/data.js` as plain JavaScript objects.

**Add a module** — find the grade in `MODULES` and push an object:

```js
{
  name: "Module Name",
  cat:  "Robotics",
  tool: "Avishkaar Robotics Pro Kit",
  acts: ["What happens in the room.", "Second activity."],
  objs: ["What they can do by the end.", "Second objective."]
}
```

**Add a matrix cell** — find the strand in `STRANDS` and add a year key:

```js
myp2: { lvl: 3, key: "Short label", what: "…", tools: "…", out: "…" }
```

`lvl` is 1–4 and maps to Introduce / Develop / Apply / Extend. It drives both the cell colour and the depth gauge, so it has to be one of those four.

**Change grade colours** — `MGRADES` in `data.js`. Keep white text above 4.5:1 contrast on any colour you pick.

## Deploying to GitHub Pages

1. Push this folder to a repository.
2. Settings → Pages → Source: **Deploy from a branch** → `main` / `root`.
3. It goes live at `https://<user>.github.io/<repo>/`.

Nothing needs compiling. If you use a project subpath, all asset links are already relative, so they resolve correctly.

## Animation

Motion is confined to `assets/css/motion.css` and a few helpers in `app.js`:

- Masthead and tab panels rise in on load
- The matrix cascades left to right on a diagonal, so the ladder builds as you watch, and the depth gauges grow after each cell lands
- Cards reveal on scroll via `IntersectionObserver`, staggered within their group
- Module counts animate up from zero
- Grade band colours cross-fade between grades
- A scroll progress bar tracks position through the page

**All of it respects `prefers-reduced-motion`.** When a visitor has reduced motion enabled, every animation is disabled, the progress bar is removed, and counters jump straight to their final value. Test it in DevTools → Rendering → Emulate CSS `prefers-reduced-motion`.

To remove animation entirely, delete the `motion.css` link from `index.html`. The page degrades cleanly — nothing depends on it.

## Browser support

Modern evergreen browsers. Uses `IntersectionObserver`, CSS custom properties and CSS Grid, all of which have a graceful fallback path (reveals apply immediately if `IntersectionObserver` is missing).

## Fonts

Fraunces, Work Sans and IBM Plex Mono, loaded from Google Fonts. If you need the site to work offline, download them into `assets/fonts/` and swap the `<link>` in `index.html` for local `@font-face` rules.

## Notes on the content

A few items are marked in the interface itself and should be verified before this is shown to a school:

- **Grade 9** in the Grades 5–9 table is tagged *Proposed* — it is an extrapolation, not confirmed curriculum.
- Three grade ranges in the controllers table carry a dotted underline, meaning they were inferred rather than supplied.
- Grades 1–4 module counts are a proposal; Grades 5–8 match the running framework.
