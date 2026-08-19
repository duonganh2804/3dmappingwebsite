# Design — SAOLATEK Platform Pages

A locked design system for the SAOLATEK Platform product pages. Every Platform
page must read this file before changing its visual structure. Extend this file
when the shared system changes; do not invent a separate theme per page.

## Genre

Modern-minimal technical product editorial.

## Macrostructure family

- Marketing pages: media-led editorial split; real company media paired with concise capability content.
- App pages: existing Viewer and Dashboard structures remain outside this design scope.
- Content pages: compact technical document with hairline dividers.

## Theme

- `--color-paper`: `oklch(16% 0.018 255)`
- `--color-paper-2`: `oklch(20% 0.022 255)`
- `--color-paper-3`: `oklch(25% 0.025 255)`
- `--color-ink`: `oklch(96% 0.012 240)`
- `--color-ink-muted`: `oklch(70% 0.025 250)`
- `--color-rule`: `oklch(100% 0 0 / 8%)`
- `--color-accent`: `oklch(87% 0.16 205)`
- `--color-accent-ink`: `oklch(16% 0.018 255)`
- `--color-focus`: `oklch(87% 0.16 205)`

The implementation consumes the established semantic variables in
`apps/web/src/index.css`; page files must not introduce one-off colour values.

## Typography

- Display and body: Plus Jakarta Sans, with Inter and system sans-serif fallbacks.
- Technical labels: JetBrains Mono, with Space Mono and monospace fallbacks.
- Headings are upright, semibold, tightly tracked, and sized to their copy length.
- Body copy stays between 45–75 characters per line where practical.

## Spacing

Use Tailwind's 4-point spacing scale. Major content widths are 1180–1440 px.
Sections use compact product-page rhythm rather than full-viewport panels.

## Motion

- Product media may autoplay only when muted, looped, and `playsInline`.
- Production Platform pages default to a user-initiated native video player with
  play/pause, audio, volume, seek, and fullscreen controls.
- No simulated data animation, fake Viewer motion, or decorative movement.
- Buttons use restrained opacity/colour feedback and respect reduced motion.

## Microinteractions stance

- Silent navigation; no celebratory UI.
- All buttons provide hover, focus-visible, active, and disabled treatment.
- Product pages do not reproduce Viewer interaction.

## CTA voice

- Primary CTA: cyan fill, dark text, 44–48 px target, compact rounded rectangle.
- Copy: “Đăng ký xem Demo” / “Request Demo Access” / “申请演示访问”.
- Destination: `/book-demo` through React Router navigation.

## Media policy

- Priority: real SAOLATEK video, real video frame, real image, then a clearly labelled neutral placeholder.
- Never render AI-generated media, fake Viewer, fake Point Cloud, fake measurement results, fake coordinates, or simulated project data.
- `surveying-shtp.mp4` is real SHTP 3D Mapping footage. It may illustrate 3D Mapping context, but must not be labelled as Point Cloud or measurement footage unless verified.
- Every media figure includes a localized title, a short contextual description,
  and a capability caveat when the footage is not specific to that capability.
- Until a verified frame is exported from the master footage, the SAOLATEK logo
  is the neutral player poster; do not fabricate a project thumbnail.
- Large local video is temporary and must move to R2/CDN before deployment.

## What Platform pages MUST share

- SAOLATEK logo and 72 px sticky header.
- 1440 px header content width and responsive horizontal padding.
- Existing language switcher behavior.
- Home button and Demo CTA presentation.
- Dark navy surfaces, cyan accent, typography, divider language, and CTA route.
- Real-media caption stating what the footage actually shows.

## What Platform pages MAY differ on

- Editorial section order and the number of capability rows.
- Whether content sits left or right of media.
- Icons selected from the existing Lucide library.

## Exports

### tokens.css

```css
:root {
  --color-paper: oklch(16% 0.018 255);
  --color-paper-2: oklch(20% 0.022 255);
  --color-paper-3: oklch(25% 0.025 255);
  --color-ink: oklch(96% 0.012 240);
  --color-ink-muted: oklch(70% 0.025 250);
  --color-rule: oklch(100% 0 0 / 8%);
  --color-accent: oklch(87% 0.16 205);
  --color-accent-ink: oklch(16% 0.018 255);
  --color-focus: oklch(87% 0.16 205);
  --font-display: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Space Mono", monospace;
  --space-3xs: 0.25rem; --space-2xs: 0.5rem; --space-xs: 0.75rem;
  --space-sm: 1rem; --space-md: 1.5rem; --space-lg: 2rem;
  --space-xl: 3rem; --space-2xl: 4.5rem; --space-3xl: 7rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 220ms;
  --radius-button: 0.75rem;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(16% 0.018 255);
  --color-ink: oklch(96% 0.012 240);
  --color-accent: oklch(87% 0.16 205);
  --font-display: "Plus Jakarta Sans", "Inter", sans-serif;
  --font-body: "Plus Jakarta Sans", "Inter", sans-serif;
  --spacing-md: 1.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper": { "$value": "oklch(16% 0.018 255)", "$type": "color" },
    "ink": { "$value": "oklch(96% 0.012 240)", "$type": "color" },
    "accent": { "$value": "oklch(87% 0.16 205)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Plus Jakarta Sans", "$type": "fontFamily" },
    "body": { "$value": "Plus Jakarta Sans", "$type": "fontFamily" }
  },
  "space": { "md": { "$value": "1.5rem", "$type": "dimension" } }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 16% 0.018 255;
  --foreground: 96% 0.012 240;
  --primary: 87% 0.16 205;
  --primary-foreground: 16% 0.018 255;
  --muted: 25% 0.025 255;
  --muted-foreground: 70% 0.025 250;
  --border: 100% 0 0 / 8%;
  --ring: 87% 0.16 205;
  --radius: 0.75rem;
}
```
