# ProjectionScrim Component

A shader-based video projection component that creates a cinematic projection screen effect in your Three.js scene.

## Features

- Custom GLSL shaders with sine-wave displacement for fabric-like flutter
- Video texture support with automatic looping
- Soft shadow vignette effect
- HTML overlay with title and subtitle
- GSAP-powered overlay animations
- Fully transparent with configurable opacity

## Usage

```tsx
import ProjectionScrim from './components/ProjectionScrim';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

function MyComponent() {
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  return (
    <>
      <ThreeMuseum onReady={(api) => setScene(api.scene)} />
      
      {scene && (
        <ProjectionScrim
          src="/pe/ray-allen.mp4"
          title="Sugar Ray PE"
          subtitle="Air Jordan 12"
          scene={scene}
          opacity={0.9}
        />
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | Yes | - | Path to video file |
| `title` | `string` | Yes | - | Main title displayed on overlay |
| `subtitle` | `string` | Yes | - | Subtitle displayed on overlay |
| `scene` | `THREE.Scene` | Yes | - | Three.js scene to add projection to |
| `opacity` | `number` | No | `0.9` | Opacity of projection (0-1) |

## Shader Details

### Vertex Shader
- Applied sine-wave displacement on both X and Y axes
- Creates gentle fabric flutter effect
- Time-based animation for smooth movement

### Fragment Shader
- Applies video texture with smoothstep vignette
- Soft shadow falloff from center to edges
- Configurable opacity for translucent look

## Video Requirements

- **Format**: MP4 recommended
- **Resolution**: 1920x1080 or 1280x720
- **Aspect Ratio**: 16:9 or 4:3
- **Location**: Place in `public/pe/` directory

## Example File Structure

```
project/
├── public/
│   └── pe/
│       ├── ray-allen.mp4
│       ├── carmelo-anthony.mp4
│       └── westbrook.mp4
└── src/
    └── components/
        ├── ProjectionScrim.tsx
        └── ProjectionExample.tsx
```

## Integration Tips

1. **Scene Setup**: Pass the scene from ThreeMuseum's `onReady` callback
2. **Positioning**: Default position is `(0, 3, -1.8)` - adjust in component
3. **Performance**: Video textures can be memory-intensive; dispose properly
4. **Autoplay**: Videos are muted and looped automatically

## Customization

To customize the projection screen size, edit the geometry in the component:

```tsx
const geometry = new THREE.PlaneGeometry(6, 4); // width, height in meters
```

To adjust shader behavior, modify the uniforms or shader code:

```tsx
uniforms: {
  uVideo: { value: texture },
  uOpacity: { value: opacity },
  uTime: { value: 0 },
}
```




