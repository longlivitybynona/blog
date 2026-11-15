# Longlivity by Nona

A German-first, bilingual editorial blog about longevity, food, nutrition, and everyday wellness. Instagram: [@longlivity.bynona](https://www.instagram.com/longlivity.bynona/).

## Development

Node.js **24+** is required. No dependencies, API keys, translation services, or package installation are needed.

```sh
npm run dev
```

This builds and serves the site at **http://localhost:3000/blog/**. Re-run after editing source files; the server serves generated files from `dist/`, not the HTML template. `PORT=3001 npm run dev` selects another port.

```sh
npm run check
npm test
npm run build
```

## Languages and URLs

- German (`de-DE`) is the default: `/blog/de/`.
- English (`en`) is the international version: `/blog/en/`.
- `/blog/` contains complete German HTML. JavaScript canonicalizes it to `/blog/de/`, or `/blog/en/` if the visitor previously selected English.
- Explicit language URLs always take precedence over the saved preference.
- DE | EN uses the History API to show the equivalent article or page without a network reload. It saves a language code in `localStorage` under `longlivity.language`; storage failures are harmless. Ctrl/Cmd-click and no-JavaScript navigation use ordinary links.
- Search uses the current language's titles, excerpts, categories, article bodies, and recipe ingredients/instructions. Category selection is retained when switching languages on the journal; search text is cleared because it belongs to the previous language.
- Back/forward navigation restores the URL's page and language. Search and filter state are transient.

Every page has static HTML with localized titles, descriptions, HTML language, canonical URL, reciprocal `de`/`en` hreflang links, and German `x-default`. The build includes Article/Recipe structured data, social metadata, a bilingual sitemap, and an accessible German 404 page. All site assets and routes use the `/blog/` base path. Direct article reloads work on GitHub Pages without a client-router fallback.

Examples:

| Page | German | English |
| --- | --- | --- |
| Journal | `/blog/de/` | `/blog/en/` |
| Bowl recipe | `/blog/de/bunte-bowl/` | `/blog/en/everyday-bowl/` |
| About Nona | `/blog/de/ueber-nona/` | `/blog/en/about-nona/` |
| Privacy | `/blog/de/datenschutz/` | `/blog/en/privacy/` |
| Legal notice | `/blog/de/impressum/` | `/blog/en/legal-notice/` |

## Editing

- `locales/de.json` and `locales/en.json`: complete hand-written language resources, including UI, accessibility labels, metadata, pages, and all six stories. No automatic browser translation is used.
- `render.js`: shared routing, search, metadata, and HTML rendering for build and browser.
- `app.js`: client navigation, language selection, search, and metadata updates.
- `index.html`: build template; do not open it directly as a finished page.
- `styles.css`: responsive styling; the language switcher and legal links are visible on mobile.
- `scripts/build.mjs`: generates 20 localized pages, the default German entry point, 404 page, sitemap, and browser data module.
- `scripts/serve.mjs`: local server that reproduces the GitHub Pages base path and directory URLs.
- `.agents/skills/longlivity-blog-posts/SKILL.md`: editorial writing skill.

For new posts, use the **same stable `id` and category key** in both resources, with a unique localized `slug`, title, description, alt text, and body. Translate recipe ingredient quantities and method without changing their meaning. The resource JSON files are the source of truth; `dist/` and `dist/data.js` are generated and ignored. Internal content HTML is trusted editorial source, never user input. Search text is escaped before rendering.

## Validation

`npm test` checks translation key parity, article equivalence, recipe times and quantities, every route and language mapping, selected-language search, all generated internal links/anchors, metadata/hreflang, storage denial, language switching without reload, and browser history through deterministic controller tests. These are not real-browser tests.

Visual desktop/mobile and assistive-technology review remains necessary: no browser automation tool is available in the current development environment. Review DE/EN headers at 320 px and 390 px, recipe layouts, all navigation, and direct reloads of each language's article URL in a browser.

## Editorial and legal status

All six stories remain editorial drafts for Nona's review. The bowl is now a complete 15-minute recipe using already cooked grains; its stock image is explicitly illustrative. No credentials, personal biography, medical outcomes, or recipe testing claims are invented.

About Nona describes only the verified brand context. Both legal pages explain the known technical setup and explicitly disclose that verified operator identity, postal address, direct contact information, and legal review have not been supplied. **They are not complete legal documents.** The owner must provide and review the missing information before treating them as legally compliant notices.

Photos load from Unsplash and fonts from Google Fonts. Both privacy versions describe these external requests, GitHub Pages hosting, language storage, and the Instagram links. No analytics, newsletter service, forms, or embedded social feed are configured.

## CI and GitHub Pages

GitHub Pages uses **GitHub Actions** as its source. Pull requests to `main` run checks, tests, and a build without deployment. Only a successful build on `main` deploys to https://longlivitybynona.github.io/blog/.

This bilingual implementation belongs on a feature branch and requires owner approval in a pull request before merging. Do not deploy it or push it to `main` before that approval.
