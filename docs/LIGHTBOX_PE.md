# LightboxPE Component

A turntable lightbox component for showcasing sneaker models with detailed annotations and interactive hotspots.

## Features

- **White Lightbox Room**: Clean, product-first environment with soft area lighting
- **GLTF Model Loading**: Support for 3D sneaker models with automatic scaling and centering
- **Auto-Rotation**: Slow Y-axis rotation with pause on pointer down
- **Annotation Hotspots**: Interactive CSS2D labels for specific features
- **Camera Focus**: Animate camera to specific annotation positions
- **Professional Lighting Setup**:
  - 2 RectAreaLights (top + front)
  - 1 Rim light (back)
  - Ambient fill

## Usage

```tsx
import LightboxPE, { Annotation } from './components/LightboxPE';

const annotations: Annotation[] = [
  {
    id: 'heel',
    pos: [0, -0.5, 1.2],
    title: 'Heel Tab',
    copy: 'Premium leather construction...',
  },
  // ... more annotations
];

<LightboxPE
  modelPath="/models/aj12-ray-allen.glb"
  annotations={annotations}
  scene={scene}
  camera={camera}
  renderer={renderer}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `modelPath` | `string` | No | Path to GLTF/GLB model file |
| `annotations` | `Annotation[]` | No | Array of annotation hotspots |
| `scene` | `THREE.Scene` | Yes | Three.js scene instance |
| `camera` | `THREE.PerspectiveCamera` | Yes | Camera instance |
| `renderer` | `THREE.WebGLRenderer` | Yes | Renderer instance |

## Annotation Type

```tsx
type Annotation = {
  id: string;              // Unique identifier
  pos: [number, number, number]; // 3D position [x, y, z]
  title: string;           // Hotspot label
  copy: string;            // Story text (for future modal)
};
```

## Camera Focus Function

```tsx
import { focusOnAnnotation } from './components/LsixboxPE';

// Focus on an annotation
focusOnAnnotation(
  camera,
  [0, 1.5, 5],      // camera position
  [0, 0, 0],        // look at position
  1.0                // duration (seconds)
);
```

## Asset Requirements

### GLTF Models

- **Format**: GLTF 2.0 or GLB (binary)
- **Size**: ≤ 5-8 MB recommended
- **Compression**: Draco compression for geometry
- **Maps**: PBR textures (albedo, roughness, metalness, normal)
- **Scale**: Will be auto-scaled to fit in scene

### File Structure

```
public/
├── models/
│   ├── aj12-ray-allen.glb
│   ├── aj1-carmelo.glb
│   └── aj3-westbrook.glb
└── pe/
    ├── ray-allen.mp4
    └── ...
```

## Lighting Setup

The component creates a professional 3-light setup:

1. **Ambient Light** (0.6 intensity): Soft overall fill
2. **RectAreaLight 1** (2 intensity, 6x6): Top-down soft shadow
3. **RectAreaLight 2** (1 intensity, 8x2): Front fill
4. **Rim Light** (3 intensity): Back edge accent

All lights are white (0xffffff) for color-neutral product photography.

## Rotation Control

- **Auto-rotation**: Slow Y-axis rotation (0.005 speed)
- **Pause on Click**: Stops when pointer is down
- **Resume**: Continues when pointer is released

## CSS2D Labels

Annotations are rendered as HTML labels overlaid on the 3D scene:
- Red transparent background (#d61f29 with 0.9 opacity)
- White text and border
- Hover scale effect
- Positioned in 3D space using CSS2DRenderer

## Integration with Showcase Modes

This component works as part of the showcase mode system:

```tsx
enum ShowcaseMode {
  Scrim = 'scrim',      // Video projection
  Panels = 'panels',    // Red panel view
  Lightbox = 'lightbox' // Detail inspection
}
```

Configure in `silhouettes.ts`:

```tsx
{
  id: 'aj12',
  showcaseMode: ShowcaseMode.Lightbox,
  modelPath: '/models/aj12-ray-allen.glb',
}
```

## Camera Choreography

The component supports camera movements:
1. Entrance (wide view)
2. Panels center (medium)
3. Push-through (close)
4. Pedestal close-up (very close)
5. Macro hops (annotation focus points)

Use `focusOnAnnotation()` for smooth camera transitions.

## Performance Tips

- **Model Optimization**: Use compressed GLB files
- **Texture Size**: Keep 2K textures for good quality/performance balance
- **Disposal**: Component handles automatic cleanup
- **Labels**: CSS2D is lightweight, many annotations are fine

## Examples

See `src/data/annotations.ts` for pre-configured annotation sets:
- `AJ12_ANNOTATIONS`
- `AJ1_ANNOTATIONS`
- `AJ3_ANNOTATIONS`




