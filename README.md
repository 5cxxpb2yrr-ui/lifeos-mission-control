# LifeOS Mission Control

Offline-first executive briefing UI built with React, TypeScript, Vite, and IndexedDB.

## Local development

```cmd
npm install
npm run dev
```

## Production build

```cmd
npm run build
```

## GitHub Pages

The project is configured for:

```text
https://5cxxpb2yrr-ui.github.io/lifeos-mission-control/
```

Push to `main` to trigger `.github/workflows/deploy-pages.yml`. See `DEPLOY.md` for first-deployment instructions.

## Data behavior

- Briefing state persists locally in IndexedDB.
- Completing an action updates the briefing.
- Deferred items move to Review Queue.
- The reset icon restores the sample briefing.
- Data remains on the current browser/device.
