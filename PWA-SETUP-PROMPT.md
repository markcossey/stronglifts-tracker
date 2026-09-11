# Deploy to GitHub Pages

The PWA setup is already complete — service worker, manifest, icons, and iOS meta tags are all in place. This prompt covers deploying to GitHub Pages so the app can be installed on an iPhone.

---

## What's already done

- `vite-plugin-pwa` installed and configured in `vite.config.ts`
- Manifest inlined via plugin config (name, icons, standalone display, dark theme)
- Icons generated in `public/` at 192, 512, and 180px
- Apple meta tags added to `index.html`
- `npm run build` produces a working `dist/` with service worker

## What needs to happen

### 1. Create a GitHub repo and push the code

Initialise git (if not already), create a repo on GitHub, and push. Make sure `.gitignore` includes `node_modules` and `dist`.

### 2. Set the Vite base path

If the repo is NOT named `<username>.github.io`, GitHub Pages serves from a subpath. Update `vite.config.ts` to set `base`:

```ts
export default defineConfig({
  base: '/<repo-name>/',
  // ... rest of config
})
```

Also update `start_url` in the PWA manifest config (inside `vite.config.ts`) to match:

```ts
manifest: {
  start_url: '/<repo-name>/',
  // ... rest of manifest
}
```

If the repo IS named `<username>.github.io`, skip this — the default `base: '/'` is correct.

### 3. Deploy with GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then in the repo's **Settings → Pages**, set Source to **GitHub Actions**.

### Alternative: manual deploy

If you'd rather not use Actions:

1. Run `npm run build` locally
2. In repo Settings → Pages, set source to "Deploy from a branch"
3. Either push the `dist/` contents to a `gh-pages` branch, or use `npx gh-pages -d dist`

### 4. Install on iPhone

1. Open `https://<username>.github.io/<repo-name>/` in Safari
2. Tap Share (square with arrow)
3. Tap "Add to Home Screen"
4. The app appears as a standalone app with the triangle icon, works offline

## Notes

- The `.npmrc` in the project sets `registry=https://registry.npmjs.org` — GitHub Actions will use this automatically, so `npm ci` will work without issues
- The app is entirely client-side with localStorage — no server needed
- After the first install, the service worker caches everything for offline use
- Updates deploy automatically on push to main (if using the Actions workflow)
- localStorage is per-origin, so data won't carry over from `localhost` — use the JSON export/import in Settings to migrate, or re-import the StrongLifts CSV
