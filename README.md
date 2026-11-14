# Longlivity by Nona

A responsive editorial blog about longevity, healthy and delicious food, nutrition, and wellness. Connected to [@longlivity.bynona](https://www.instagram.com/longlivity.bynona/).

## Local development

Requires Node.js 20 or newer. No third-party dependencies or installation required.

```sh
npm run dev
```

Open http://localhost:3000. To validate and build:

```sh
npm run check
npm run build
```

The static output is written to `dist/`. Nothing is published automatically.

## Editing

- `index.html`: page structure, branding, Instagram links.
- `styles.css`: responsive design and visual tokens.
- `app.js`: draft articles, category filters, search, and article dialogs.
- `scripts/`: dependency-free development server and static build.

## Editorial status

All six initial stories are illustrative editorial drafts awaiting Nona’s review. They are not represented as published Instagram content. No biography, credentials, or health outcomes have been invented. The visual direction is proposed; it is not a verified reproduction of the Instagram feed.

Photos load from Unsplash and fonts from Google Fonts, requiring internet access. Before publication, review content, image suitability, accessibility in a browser, and applicable privacy requirements. No analytics, newsletter service, or personal data collection is configured.

## GitHub Pages

In repository Settings → Pages, choose **GitHub Actions** as the build and deployment source. The Pages workflow builds and deploys whenever changes reach `main`, and can also be run manually from Actions.

Expected public URL after a successful deployment: https://elonathanasi-28.github.io/blog/

The owner authorized merging and deployment to GitHub Pages. Initial stories remain labeled as editorial drafts.
