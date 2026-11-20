# Contributing to Fanzines

Thanks for helping. Fanzines is a browser editor for 8-panel zines folded from one A4 sheet: you lay out text and photos, review the imposed sheet, and export a PDF ready to print, cut and fold. Bug reports, fixes, translations and design improvements are all welcome.

You can write issues and pull requests in English or Spanish.

## Before you start

- **Small fixes** (a typo, an obvious bug, a wrong translation): open a pull request directly.
- **Anything bigger** (a new feature, a new dependency, a change to how the editor looks or works): open an issue first so we can agree on the approach before you spend time on it.
- Issues labelled [`good first issue`](https://github.com/krthr/fanzines.app/labels/good%20first%20issue) and [`help wanted`](https://github.com/krthr/fanzines.app/labels/help%20wanted) are good places to start. Comment on one before you start, so two people don't work on the same thing.

A few things are deliberate, and pull requests that change them are unlikely to be merged:

- **Everything happens in the browser.** The zine lives in memory on the user's device. Images are never uploaded, and there are no accounts or server storage.
- **The format is fixed:** one A4 sheet, eight panels, the imposition in [`app/utils/zineLayout.ts`](app/utils/zineLayout.ts).
- **Few dependencies.** Use what's already there (Nuxt UI, Konva, jsPDF, GSAP) before adding a package, and explain in the pull request why a new one is needed.
- **Analytics stay optional.** PostHog only runs when its key is set. Don't add trackers or third-party requests.

## Set up

You need **Node.js 26** (pinned in [`.nvmrc`](.nvmrc)) and npm.

```bash
git clone https://github.com/<your-username>/fanzines.app.git
cd fanzines.app
nvm use        # or install Node 26 another way
npm ci
npm run dev
```

The dev server runs at http://localhost:3000. The editor is at `/editor`; the English pages are `/en` and `/en/editor`.

No environment variables are needed. [`.env.example`](.env.example) lists the only one (the PostHog key); leave it empty. The warning `registry.posthog: missing required field 'apiKey'` during `dev` and `build` is expected.

## Where things live

The [README](README.md#project-structure) has the full file tree and architecture notes. The short version:

| Path | What it is |
| --- | --- |
| `app/pages/index.vue`, `app/pages/editor.vue` | The landing and the editor page (with its prerendered fallback) |
| `app/components/zine/` | The editor. `ZineEditor.client.vue` is the shell; the rest are its panels, canvas and dialogs |
| `app/composables/useZineStore.ts` | The zine itself: pages, elements, selection (`useState`) |
| `app/composables/useZineEditorView.client.ts` | View-only state (Design or Review mode, single or facing pages). Not part of the zine |
| `app/utils/zineLayout.ts` | A4 geometry and imposition. State uses page units (`PAGE_W` = 1000); the UI shows millimetres and points |
| `app/utils/render*.client.ts`, `app/utils/exportPdf.client.ts` | Konva rendering shared by thumbnails, the sheet and the 300 DPI PDF |
| `i18n/locales/` | All user-visible text: `es-CO.json` (default) and `en-US.json` |
| `app/assets/css/main.css` | Design tokens. [`DESIGN.md`](DESIGN.md) explains how they're used |

## Conventions

### Code

- TypeScript everywhere. Vue components use `<script setup lang="ts">`.
- Two-space indentation, single quotes, no semicolons, no trailing commas. [`.editorconfig`](.editorconfig) covers whitespace; there's no formatter or linter, so match the file you're in and don't reformat code you aren't changing.
- Code that needs the browser (Konva, canvas, `File`, `window`, PostHog) goes in a `*.client.ts` or `*.client.vue` file. Pages are prerendered on the server, and browser APIs aren't available there.
- Comments explain *why*, not *what*.

### Text and languages

The site is in Colombian Spanish (`es-CO`, the default, at `/` and `/editor`) and US English (`en-US`, at `/en` and `/en/editor`).

- Every user-visible string lives in `i18n/locales/`, under the **same key in both files**. Use `t('key')` in components; don't hard-code text.
- `|` separates singular and plural (`"Suelta la foto | Suelta las {count} fotos"`), so a message can't contain a literal `|`. A title over several lines is one message with `\n` line breaks, split by [`toLines`](app/utils/textLines.ts).
- Internal links use `<NuxtLinkLocale>` (or `useLocalePath`) so they stay in the current language.
- Page names ("Front cover", "Page 1", "the back cover", and their Spanish versions) come from [`useZinePageLabels`](app/composables/useZinePageLabels.ts).
- An image with text in it has an English twin with an `-en` suffix (`fold-guide.webp`, `fold-guide-en.webp`); [`useLocalizedImage`](app/composables/useLocalizedImage.ts) picks the right one. The folding guide's template is drawn empty in both: [`FoldGuide`](app/components/zine/FoldGuide.vue) writes the page labels from the imposition, so don't letter them into the images.

If you only write one of the two languages, add your best attempt at the other and say so in the pull request; it will get reviewed.

### Design

[`DESIGN.md`](DESIGN.md) is the design system: palette, type, spacing, components and their rules. Use the tokens in `main.css` instead of new colours or fonts. In the editor, the page being designed is the brightest thing on screen, and there's one orange action per screen.

## Check your change

There are no automated UI tests yet, so checking by hand matters. Before you open a pull request:

```bash
npm run typecheck
npm run build
```

[CI](.github/workflows/ci.yml) runs the same type-check on every pull request, then builds the Cloudflare Worker that production runs.

Then try it in the browser:

- Use the change at `/editor` and `/en/editor` (or `/` and `/en` for the landing).
- Narrow the window: on mobile the editor has its own action bar and page strip.
- If you touched rendering or export, export a PDF and open it. Printing and folding it is the real test.

To run the production Worker locally (rarely needed):

```bash
WORKERS_CI=1 npm run build   # builds exactly what Workers Builds deploys
npx wrangler dev
```

## Commits and pull requests

- Branch from `main`, one topic per pull request.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`, in the imperative and lowercase. The usual types are `feat`, `fix`, `chore`, `docs` and `refactor`; the scope is the area you changed, such as `editor`, `landing`, `i18n`, `seo` or `pdf`. For example: `fix(editor): keep the selection when switching pages`.
- Use `npm ci`, not `npm install`, and don't commit changes to `package-lock.json` unless your pull request is about dependencies.
- Fill in the pull request template and add before/after screenshots for anything visible.
- CI has to pass. After review, the maintainer merges, and `main` deploys to [fanzines.app](https://fanzines.app) automatically.

## Community

- Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Found a security problem? Report it privately, as [`SECURITY.md`](SECURITY.md) explains, not in a public issue.
- Fanzines is [MIT licensed](LICENSE). By contributing, you agree that your contributions are released under the same license.
