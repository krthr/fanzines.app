# Fanzines Design System

## 1. Atmosphere & Identity

Fanzines feels like a handmade print table translated into a browser: rough paper, loud crop marks, high-contrast ink, and tactile editorial controls. The signature is punk paper depth: cream stock, black ink, acid highlights, red cut marks, hard shadows, and slightly rotated physical media.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface/dark | `--zine-bg` | `#070706` | Site and editor background |
| Surface/page | `--zine-page` | `#ffffff` | Printable page and canvas surfaces |
| Surface/paper | `--zine-paper` | `#eee8d8` | Primary paper text, borders, and panels |
| Surface/paper-hot | `--zine-paper-hot` | `#fff6c8` | Warm elevated UI surfaces |
| Surface/paper-deep | `--zine-paper-deep` | `#d6c9ae` | Muted controls and secondary paper surfaces |
| Text/ink | `--zine-ink` | `#070706` | Text on paper or accent surfaces |
| Text/muted | `--zine-muted` | `#665f51` | Muted paper-side text |
| Border/ink | `--zine-border` | `rgb(7 7 6 / 38%)` | Paper-side borders |
| Accent/acid | `--zine-accent` | `#e7ff36` | Primary CTA and focus color |
| Accent/red | `--zine-cut` | `#f23d25` | Cut marks, destructive accents, primary red CTA |
| Accent/cyan | `--zine-cyan` | `#17b6c8` | Secondary accent |
| Shadow/collage | `--zine-shadow` | `14px 14px 0 rgb(242 61 37 / 72%), 0 22px 54px rgb(0 0 0 / 40%)` | Collage-style elevation |

### Rules

- Use cream paper and near-black ink as the dominant contrast.
- Use acid and red as functional accents for CTAs, focus rings, cut marks, selected states, and important labels.
- Keep colors high contrast and graphic; do not introduce soft gradients as a replacement for the print-table style.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `3.12rem` to `7rem` | 900 | 0.86 to 0.95 | 0 | Hero and large section headlines |
| Title | `1.36rem` to `1.72rem` | 900 | 0.95 | 0 | Step titles and compact editorial headings |
| Body/lg | `1.04rem` to `1.18rem` | 600 | 1.52 | 0 | Landing body copy |
| Body | `1rem` | 600 to 700 | 1.25 to 1.45 | 0 | Captions and card text |
| Control | `0.68rem` to `0.95rem` | 800 to 900 | 1 | 0 | Navigation, buttons, and footer links |

### Font Stack

- Primary: `Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Display: `Impact, "Arial Black", Outfit, sans-serif`
- Mono/editorial: `"Special Elite", "Courier New", monospace`

### Rules

- Headlines are uppercase, heavy, and tightly set.
- Body text stays readable and never drops below the current compact navigation size.
- Letter spacing remains `0`; the visual identity comes from weight, texture, and layout rather than tracking.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px base. Existing one-off collage offsets may be asymmetric, but gaps, padding, and control dimensions should stay on the 4px rhythm where practical.

| Token | Value | Usage |
| --- | --- | --- |
| Space/compact | `8px` | Tight inline groups |
| Space/control | `12px` | Icon/text and compact controls |
| Space/default | `16px` | Captions, labels, and small panels |
| Space/comfy | `24px` | Cards and section internals |
| Space/section | `96px` to `170px` | Major landing sections |

### Grid

- Max content width: `1240px`.
- Mobile content inset: `14px` to `18px`.
- Responsive breakpoints already used in code: `500px`, `760px`, `1040px`, `1180px`.

### Rules

- Preserve the full-width landing bands and unframed section layouts.
- Use fixed-format dimensions for hero media, cards, buttons, and editor controls so hover states do not shift layout.
- Let mobile stack vertically before text starts crowding or wrapping awkwardly.

## 5. Components

### Site Header

- **Structure**: brand link with scissors icon, then section navigation.
- **Variants**: desktop horizontal, mobile stacked with three equal nav cells.
- **States**: nav links invert to acid background on hover; focus uses acid outline.
- **Accessibility**: header has a navigation label and every link remains text-based.
- **Motion**: entrance animation only when reduced motion is not requested.

### Button

- **Structure**: text link styled as a hard-edged paper button.
- **Variants**: primary red, secondary paper.
- **States**: hover lifts with hard shadow, active compresses, focus uses acid outline.
- **Accessibility**: preserve link semantics for navigation.
- **Motion**: transform and shadow only.

### Paper Media

- **Structure**: bordered image with clipped/rotated collage frame and hard black shadow.
- **Variants**: hero main shot, hand shot, table photo, fold guide.
- **States**: image zoom on hover.
- **Accessibility**: all meaningful images need descriptive alt text.
- **Motion**: transform/filter only; scroll-triggered image treatment respects reduced motion.

### Step Card

- **Structure**: ordered list item with generated counter, strong title, and body copy.
- **Variants**: paper, acid, red.
- **States**: static instructional surface.
- **Accessibility**: rendered as an ordered list.
- **Motion**: section reveal only when reduced motion is not requested.

### Site Footer

- **Structure**: brand text plus author credit and external author links.
- **Variants**: desktop horizontal, mobile stacked.
- **States**: author links use acid hover/focus treatment.
- **Accessibility**: footer links use descriptive labels and visible focus.
- **Motion**: no decorative motion.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | `180ms` | `ease` | Buttons, skip link, footer links |
| Media | `700ms` | `ease` | Image hover zoom |
| Entrance | `0.75s` to `1s` | GSAP `power2.out` / `power3.out` | Header, hero, section reveals |
| Scroll-driven | tied to scroll | `none` | Image grayscale/contrast/scale treatment |

### Rules

- Animate only `transform`, `opacity`, `filter`, color/background, and shadow.
- Respect `prefers-reduced-motion` by skipping GSAP entrance and scroll effects.
- Do not add motion to non-interactive elements unless it is an intentional page entrance or scroll reveal.

## 7. Depth & Surface

### Strategy

Mixed print depth: hard borders, hard shadows, paper fills, clipped edges, rotated objects, and subtle texture overlays.

| Level | Treatment | Usage |
| --- | --- | --- |
| Texture | grid, halftone, and scanline overlays | Site and editor backgrounds |
| Paper | cream fill plus ink border | Panels, cards, buttons, media frames |
| Collage | hard black or red shadow plus slight rotation | Hero media and editorial callouts |
| Focus | acid outline | Keyboard focus and active controls |
