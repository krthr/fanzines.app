# Fanzines Design System

## 1. Atmosphere & Identity

Fanzines feels like a handmade print table translated into a browser: a near-black desk, cream paper, burnt orange, acid highlights and typewriter notes. The signature is punk paper depth: flat surfaces, hard offset shadows with no blur, and slightly rotated stickers and photos.

The landing, the error page and the editor share one palette and one set of fonts. The landing is the loud poster; the editor is the same table with the volume turned down so the page being designed is the brightest thing on screen.

## 2. Color

### Palette

Brand tokens are defined once, on `:root` in `app/assets/css/main.css`. Pages and components never redeclare them.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface/dark | `--bg` | `#0b0a09` | Page background, editor top bar and sidebar |
| Surface/cream | `--ink` | `#ede7da` | Text on dark; cream panels (inspector, dialog, toasts, mobile bar) |
| Surface/paper | `--paper` | `#f4f0e8` | Lighter paper: landing cards, floating toolbar |
| Text/muted | `--muted` | `#a8a196` | Secondary text on dark |
| Text/ink | `--ink-dark` | `#0b0a09` | Text and strokes on cream, acid and orange |
| Text/secondary | `--text-dark` | `#3a3631` | Secondary text on cream; inactive progress ticks |
| Text/panel number | `--panel-num` | `#b5aea2` | Panel numbers on the landing's sheet diagram |
| Border/line | `--line` | `#2a2724` | Hairlines on dark |
| Accent/orange | `--orange` | `#d25a36` | Primary action, selection frame and handles, size tag |
| Accent/orange deep | `--orange-deep` | `#8e3a22` | Hard shadows, destructive icons |
| Accent/acid | `--acid` | `#e9ff5c` | Active page, toggles on, stickers, focus ring on dark |

The editor adds a few neutrals that sit between those tokens (`--ed-canvas` `#100e0d` for the canvas area, `--ed-raised` `#1f1c19` for the active spread, `--ed-dim`, `--ed-faint`, `--ed-label`, `--ed-hairline`). They live next to the brand tokens because the drawer and the dialog are teleported outside the editor shell.

Fixed colours with one job each: the printable page is always `#ffffff`; the safe-margin guide is `rgb(0 163 255 / 40%)`; the cut line on the sheet is `#e5372b`; a passed check is `#2e7d4f`; the hint note is `#fbf7c9`.

Text in a zine can take five colours, the swatches in `TEXT_COLOR_OPTIONS`: `#0b0a09`, `#ffffff`, `#d25a36`, `#e9ff5c`, `#2f5bea`.

### Rules

- Cream paper and near-black ink carry the contrast. Orange and acid are functional: actions, selection, the current page, focus.
- One orange action per screen: "Revisar e imprimir" while designing, "Descargar PDF" in review.
- Acid marks where you are (current page, current step, selected font, a switch that is on). It is never used for plain decoration in the editor.
- Colours stay flat. No gradients, no texture overlays.

## 3. Typography

### Font Stack

| Role | Token | Stack |
| --- | --- | --- |
| Display | `--font-display` | `Anton, Impact, "Arial Narrow Bold", sans-serif` |
| Body | `--font-body` | `Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Typewriter | `--font-type` | `"Special Elite", "Courier New", monospace` |

Anton, Outfit and Special Elite are loaded through `@nuxt/fonts`. The fonts a zine can use are a separate list, `FONT_OPTIONS` (system fonts), and the editor shows each name in its own face.

### Scale

| Level | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| Display (landing) | `clamp()` from `2.25rem` to `6.5rem` | 400 (Anton) | 0.95 | Hero and section headlines, uppercase |
| Display (dialog) | `52px` | 400 (Anton) | 0.95 | "Tu fanzine está listo." |
| Panel heading | `18px`, tracking `1px` | 400 (Anton) | `27px` | PÁGINAS, IMAGEN, TEXTO, REVISIÓN, uppercase |
| Title | `16px` | 700 | `20px` | Editor name, page name |
| Body (landing) | `15px` to `22px` | 400 to 700 | 1.5 | Landing copy |
| Control | `13px` to `15px` | 600 to 700 | `16px` to `19px` | Buttons, switches, labels |
| Meta | `13px` | 400 | `16px` | Secondary lines under a title |
| Typewriter | `13px` to `15px` | 400 | 1 to 1.2 | File names, measurements, stickers, key hints |

### Rules

- Display type is uppercase Anton. In markup it is written in sentence case and uppercased in CSS.
- Interface text does not go below `12px` (the labels in the mobile bars). The only smaller text is the annotation on the sheet: the "corte" tag and the panel labels.
- Measurements are shown in millimetres (positions and sizes) and points (type size), never in the store's page units. They are the page's nominal size, 74.25 × 105 mm per panel: with "Margen seguro de 5 mm" on, the PDF scales the sheet to about 95%, so everything prints that much smaller.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px base. Collage offsets on the landing may be asymmetric; gaps, padding and control sizes stay on the 4px rhythm where practical.

| Token | Value | Usage |
| --- | --- | --- |
| Space/compact | `8px` | Tight inline groups, gaps between paired buttons |
| Space/control | `12px` | Icon and text, navigation gaps |
| Space/default | `16px` to `20px` | Panel padding, gaps between groups |
| Space/comfy | `24px` to `32px` | Canvas gutters, dialog padding |
| Space/section | `120px` | Major landing sections (`--section-y`) |

### Landing

- Max content width `1200px` (`--content`), gutter `48px` (`--gutter`).
- Breakpoints: `1040px` and `760px`.

### Editor

Desktop, from `1024px`:

| Region | Size |
| --- | --- |
| Top bar | `64px` tall |
| Pages sidebar | `272px` wide |
| Canvas header | `68px` tall |
| Shortcut hints | `41px` tall, always reserved so the page does not move when something is selected |
| Inspector | `320px` wide |

Below `1024px` the editor shows one page at a time: top bar `56px`, page header `44px`, the page, the context bar, and the page strip. From `768px` the guides switch sits in the top bar.

A panel is 74.25 × 105 mm. On the canvas a single page ("Página") is 440 × 622 px at 1440 × 900, and a spread ("Doble") is two pages of 372 × 526 px with a 2px gutter; both scale with the window.

### Rules

- Controls have fixed sizes so hover and selected states never shift the layout.
- The canvas never scrolls: the page is fitted to the space it has.
- When the canvas column is narrower than `620px`, the view switch keeps its icons and drops the words.

## 5. Components

### Landing

- **Site header**: brand link with the scissors icon, section links, and "Abrir editor".
- **Button**: primary is orange with a 4px `--orange-deep` shadow and lifts on hover; dark is `--ink-dark` with a cream border; a text link carries an arrow.
- **Photo**: bordered in cream, rotated a few degrees, zooms slightly on hover.
- **Sticker**: acid background, typewriter face, rotated, with a small hard shadow.
- **Steps, features, FAQ**: plain lists on full-width bands, no cards.
- **Footer**: brand, author credit and external links.

### Editor

- **Top bar**: brand block (`EditorBrand`, shared with the prerendered fallback), "+ Texto" and "+ Imagen", eight progress ticks in reading order, and the orange action. In review the add buttons give way to the stepper Diseñar → Revisar → Imprimir y doblar.
- **Pages sidebar**: "Lectura" lists the reading spreads (Portada alone on the right, 1|2, 3|4, 5|6, Contraportada alone on the left) with live miniatures; "Pliego" shows the imposed sheet. The current page has a 3px acid frame and its spread a raised background. The reset button is an icon in the header.
- **Canvas**: the page on white with a 10px `--orange-deep` shadow. "Doble" adds the facing page at 68% opacity, read-only; clicking it selects it. The covers have no facing page. "Guías" draws the 5 mm safe margin.
- **Selection**: 2px orange frame, white handles with an orange stroke (12px, 18px on touch), a round handle to rotate. A paper toolbar floats above (Rellenar, Encajar, Al frente, Atrás, Eliminar; text has the last three) and hides while dragging, transforming or editing text. An orange tag below gives width × height in mm.
- **Empty page**: a paper card with "Suelta tus fotos", "Elegir fotos" and a link to start with text.
- **Inspector**: cream panel. An image has Ajustar a la página (Rellenar, Encajar, Centrar), Opacidad, Giro and order. Text has the font list, size in points, style, alignment, five colour swatches, order and delete. "Medidas exactas" is a disclosure, closed by default, with X, Y, Ancho and Alto in mm and the page alignment buttons (and, for text, Opacidad and Giro).
- **Controls**: segmented switch (cream segment on a hairline box), toggle (acid track, dark knob), slider (3px track, square acid knob), field (grey label left, value right, white box), bordered action (1px `--ink-dark`, inverts on hover).
- **Shortcut hints**: typewriter keys under the canvas, only for shortcuts that exist in the current state.
- **Review**: the sheet large, with its fold and cut guides when the PDF will carry them; on the right, the page count, and the two PDF switches. The export error appears in the same panel.
- **PDF listo**: a dialog after a successful export, with the fold guide, the print-at-100% callout, "Descargar otra vez" and "Volver al editor".
- **Drop overlay**: covers the canvas while files are dragged over the editor, states the one-image-per-page rule, and the miniatures that will receive a photo light up in acid. If none of the files is an image it says so and promises nothing.
- **Toast**: cream paper, 2px dark border, 6px orange shadow, bottom right. Every toast looks the same whatever its severity.
- **Mobile**: a context bar with the selection's actions (or "+ Texto" and "+ Foto"), "Ajustes" opening the inspector in a drawer, and a strip of page miniatures.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | `180ms` | `ease` | Buttons, switches, links, colour and border changes |
| Overlay | `200ms` | ease-out | Dialog and toast entrance |
| Media | `700ms` | `ease` | Photo zoom on hover (landing) |
| Entrance | `0.75s` to `1s` | GSAP `power2.out` / `power3.out` | Landing header, hero and section reveals |

### Rules

- Animate only `transform`, `opacity`, colour, background, border colour and shadow.
- The primary button lifts 2px on hover and presses into its shadow when active.
- `prefers-reduced-motion` turns off the landing's GSAP entrances and the editor's transitions.
- Nothing on the canvas animates: a page must look exactly as it will print.

## 7. Depth & Surface

### Strategy

Flat surfaces separated by colour, with hard offset shadows for the few things that sit above the table.

| Level | Treatment | Usage |
| --- | --- | --- |
| Desk | `--bg`, hairlines in `--line` | Page background, top bar, sidebar |
| Canvas | `--ed-canvas` | The area around the page |
| Paper | Cream or white fill | Inspector, the page, the sheet, dialog, toasts |
| Lifted | Hard shadow, no blur: 4px to 12px in `--orange-deep` or `--orange` | Primary button, the page, floating toolbar, dialog, toasts |
| Focus | 2px outline: acid on dark, `--ink-dark` on cream | Keyboard focus |

Corners are square everywhere except the toggle, the round rotation handle and the icon badge on an empty page.
