# Asset Checklist

This document outlines all the media assets needed for the Air Fair museum.

## Video Assets (Projection Scrim)

### Requirements
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1080p (1920x1080)
- **Frame Rate**: 24-30 fps
- **Duration**: 6-10 second loops
- **Location**: `public/pe/`

### Files Needed
- [ ] `carmelo-anthony.mp4` - AJ1 Melo PE archival footage
- [ ] `westbrook.mp4` - AJ3 Why Not? PE highlights
- [ ] `ray-allen.mp4` - AJ12 Sugar Ray PE court moments

### Poster Images (Optional)
- [ ] `carmelo-anthony-poster.jpg` - Preview thumbnail
- [ ] `westbrook-poster.jpg`
- [ ] `ray-allen-poster.jpg`

## 3D Models (Lightbox Mode)

### Requirements
- **Format**: GLB (binary GLTF 2.0)
- **Size**: ≤ 5-8 MB
- **Compression**: Draco geometry compression
- **Location**: `public/models/`

### Files Needed
- [ ] `aj12-ray-allen.glb` - Main AJ12 model
- [ ] `aj1-carmelo.glb` - (Optional) AJ1 model
- [ ] `aj3-westbrook.glb` - (Optional) AJ3 model

### Texture Maps (included in GLB)
- [ ] Base color / Albedo
- [ ] Roughness map
- [ ] Metalness map
- [ ] Normal map
- [ ] Ambient occlusion (optional)

### Model Guidelines
- **Scale**: Real-world size (will be auto-scaled)
- **Details**: Include lace eyelets, heel tab, outsole detail
- **PBR**: Physically based rendering materials
- **UVs**: Proper unwrapping for textures

## Normal Map (Projection Scrim)

### Requirements
- **Format**: PNG
- **Resolution**: 2K (2048x2048)
- **Type**: Seamless/tileable
- **Location**: `public/textures/`

### File Needed
- [ ] `curtain-normal.png` - Fabric texture normal map

## Audio Assets (Ambient)

### Requirements
- **Format**: MP3 or OGG
- **LUFS**: -18 LUFS average
- **Default Volume**: < -20 dB
- **Duration**: 1-2 minute loop
- **Location**: `public/audio/`

### Files Needed
- [ ] `court-ambience.mp3` - Court/arena background
- [ ] `basketball-bounce.mp3` - (Optional) spot effects

## Current Status

### Existing Files
- None yet - all placeholder paths configured

### Next Steps
1. Source video footage from Jordan Brand archives
2. Commission 3D models or scan physical shoes
3. Create/acquire textures and normal maps
4. Record ambient audio or source library tracks
5. Process all assets according to specifications

## Testing

Once assets are added:
1. Videos should auto-play in ProjectionScrim
2. Models should load in LightboxPE with annotations
3. Audio should loop in background (optional toggle)

## Example URLs (Temporary Testing)

For development testing, you can use placeholder URLs:
- Videos: Replace with actual footage
- Models: Use Three.js example models temporarily
- Audio: Use browser audio elements




