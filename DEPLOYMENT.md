# Deployment to GitHub Pages

This project is set up to automatically deploy to GitHub Pages using GitHub Actions.

## How It Works

1. **Build Script** (`npm run build`): Generates static HTML files from your EJS templates and tournament data
   - Pre-renders all pages (tournaments, events, rankings)
   - Outputs files to the `./docs` directory
   - Copies public assets (CSS, images, etc.)

2. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`): Automatically builds and deploys on every push to `main`
   - Installs dependencies
   - Runs the build script
   - Deploys to GitHub Pages

## Initial Setup

To enable GitHub Pages for this repository, follow these steps:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**

That's it! GitHub Actions will automatically build and deploy your site.

### 2. Push Your Changes

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (usually takes 1-2 minutes)
4. Once complete, your site will be available at: `https://[your-username].github.io/tourney-results/`

## Manual Build

To build the static site locally for testing:

```bash
npm run build
```

This will generate all static HTML files in the `./docs` directory. You can open these files in your browser to preview the site.

## Updating Content

Whenever you update your tournament data files (`data/tournaments.json`, `data/singles-events.json`, `data/singles-standings.json`), simply push the changes to GitHub:

```bash
git add data/
git commit -m "Update tournament data"
git push origin main
```

GitHub Actions will automatically rebuild and redeploy your site with the updated data.

## Development Workflow

For local development, continue using the Express server:

```bash
npm start
# or for auto-reload during development
npm run dev
```

The Express app provides the same functionality as the static site, but allows for easier development and testing.
