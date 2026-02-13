# Fight Timer

Random intensity training timer for combat sports. Alternates between intense and normal periods at randomized intervals within timed rounds, simulating the unpredictable rhythm of a real fight.

Single-file React app. No backend, no accounts — config lives in the URL for easy sharing.

## Features

- Randomized intensity switching with audio bell cues
- 4 timing modes (Chaos, Balanced, Endurance, Custom)
- Progressive intensity (rounds get harder)
- Shareable presets via URL
- 4 color themes with light/dark variants
- Installable as a PWA (works offline on mobile)

## Development

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` auto-deploy via GitHub Actions to GitHub Pages.
