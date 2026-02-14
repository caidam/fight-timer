# Fight Timer

Random intensity training timer for combat sports. Alternates between intense and normal periods at randomized intervals within timed rounds, simulating the unpredictable rhythm of a real fight.

React app. No backend, no accounts — config lives in the URL for easy sharing.

## Features

- Randomized intensity switching with audio bell cues
- 4 timing modes (Chaos, Balanced, Endurance, Custom)
- Progressive intensity (rounds get harder)
- Optional warm-up and cool-down phases
- Multiple presets with drag-to-reorder
- Shareable presets via URL with smart import/duplicate detection
- Session summary with intensity stats
- Hide timer (glitch effect with censorship bar, tap or button to reveal)
- Hide switch countdown toggle
- Pause/resume and fullscreen during training
- Wake lock keeps screen on
- 4 color themes with light/dark variants
- English and French
- Installable as a PWA (works offline on mobile)

## Install on mobile

No app store needed. Add to your home screen for a full-screen app that works offline:

- **iPhone/iPad**: Open in Safari → tap share (□↑) → "Add to Home Screen"
- **Android**: Open in Chrome → tap menu (⋮) → "Add to Home screen" or "Install app"

## Development

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` auto-deploy via GitHub Actions to GitHub Pages.
