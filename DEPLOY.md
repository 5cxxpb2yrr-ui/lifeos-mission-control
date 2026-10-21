# Deploy LifeOS Mission Control

Repository:

```text
https://github.com/5cxxpb2yrr-ui/lifeos-mission-control
```

Published site:

```text
https://5cxxpb2yrr-ui.github.io/lifeos-mission-control/
```

## First deployment from Windows Command Prompt

Run these commands from this project folder:

```cmd
npm install
npm run build
git init
git add .
git commit -m "Deploy LifeOS Mission Control"
git branch -M main
git remote add origin https://github.com/5cxxpb2yrr-ui/lifeos-mission-control.git
git push -u origin main
```

If the remote already exists, use:

```cmd
git remote set-url origin https://github.com/5cxxpb2yrr-ui/lifeos-mission-control.git
git push -u origin main
```

## Enable Pages

In the GitHub repository:

1. Open **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and monitor **Deploy LifeOS to GitHub Pages**.

## Updates

After changing the app:

```cmd
npm run build
git add .
git commit -m "Update LifeOS"
git push
```

Pushing to `main` triggers a new deployment.

## Local production preview

Because the production base path is `/lifeos-mission-control/`, preview at:

```cmd
npm run build
npm run preview -- --host --port 4274
```

Open:

```text
http://localhost:4274/lifeos-mission-control/
```

## Local data

LifeOS briefing changes are stored in IndexedDB per browser and origin. Data saved on localhost does not automatically transfer to the GitHub Pages deployment. The deployed app will create its own local database on first launch.
