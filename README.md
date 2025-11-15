# Air Fair — The Digital Museum of Jordan Silhouettes

A modern, interactive web experience that brings the iconic Air Jordan sneakers and their player-exclusive stories to life in a 3D digital museum.

## Features

- **Clean 3D Museum**: Minimalist design with Three.js
- **Player-Exclusive Silhouettes**: Explore AJ1, AJ3, and AJ12 with athlete stories
- **Smooth Camera Transitions**: GSAP-powered animations between exhibits
- **Ambient Lighting**: Subtle light sway for atmosphere
- **Dark Theme**: Clean, modern dark aesthetic with Jordan red accents

## Tech Stack

- **React** + **TypeScript** for the UI
- **Vite** for fast development and building
- **Three.js** (r158) for 3D rendering
- **GSAP** for smooth camera animations

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see the museum.

### Build

```bash
npm run build
```

## Project Structure

```
air-fair/
├── src/
│   ├── components/
│   │   ├── ThreeMuseum.tsx    # Main 3D scene component
│   │   └── SneakerRoom.tsx    # UI overlay for story panels
│   ├── data/
│   │   └── silhouettes.ts     # Silhouette data and types
│   ├── lib/
│   │   └── camera.ts          # Camera transition helpers
│   ├── App.tsx                # Main app with navigation
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles with CSS variables
│   └── App.css                # Component-specific styles
├── index.html
├── package.json
└── vite.config.ts
```

## Current Exhibits

- **AJ1 - Carmelo Anthony PE** (2003)
- **AJ3 - Russell Westbrook PE** (2017)
- **AJ12 - Ray Allen PE** (2008)

## Design Philosophy

This project follows a clean, minimalist approach:
- **Separation of Concerns**: 3D scene logic in ThreeMuseum, UI in SneakerRoom
- **Simple API**: ThreeMuseum exposes a clean API for adding sneakers
- **Declarative Data**: Silhouette data drives the entire experience
- **CSS Variables**: Easy theming via CSS custom properties
- **Type Safety**: Full TypeScript coverage

## Next Steps

- Load actual GLTF/GLB 3D models of the sneakers
- Add more Jordan silhouettes (AJ4, AJ5, etc.)
- Implement interactive elements (click sneakers for details)
- Add ambient sound toggle
- Enhanced camera controls (zoom, pan)

## Credits

Built as a digital tribute to the legendary Air Jordan sneaker legacy and the athletes who've inspired generations.
