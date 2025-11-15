# Air Fair — Build Roadmap

## ✅ Phase 1 — Projection Scrim (Complete)

### Implementation
- ✅ Custom shader with `uVideo`, `uTime`, `uOpacity`
- ✅ `fadeIn()` / `fadeOut()` methods with Promises
- ✅ Subtle vertex displacement animation
- ✅ Vignette soft shadow effect
- ✅ Title/subtitle HTML overlay

### Assets Needed
- Videos for each silhouette (6-10s loops, 1080p H.264)
- Poster frames for quick loading

## 🏗️ Phase 2 — Reveal Panels (Complete)

### Implementation
- ✅ Three-plane triptych with shared VideoTexture
- ✅ `sync()` method for video time alignment
- ✅ `open()` async timeline with GSAP
- ✅ X-position animation: [-1.3, 0, 1.3] → [-2.2, 0, 2.2]
- ✅ Opacity fade: 0.7 → 1
- ✅ Auto camera transition after open

### Integration
- Mounts on AJ3 selection
- Opens panels, then transitions to lightbox mode

## 🔍 Phase 3 — Lightbox PE (Complete)

### Implementation
- ✅ White box room with 5 planes
- ✅ Professional 3-light setup (2 RectAreaLights + rim)
- ✅ GLTFLoader for 3D models
- ✅ Auto-rotation with pointer pause
- ✅ CSS2DRenderer for annotation hotspots
- ✅ `focus(id)` camera animation
- ✅ Annotation system with positions

### Content Needed
- Draco-compressed GLTF models (≤ 8MB)
- PBR textures (base, rough, metal, normal)
- 3-5 annotations per PE with stories

## 🔧 Phase 4 — System Glue (Complete)

### State Machine
- ✅ `useShowcaseState` hook
- ✅ Mode management: scrim → panels → lightbox
- ✅ Transition handling with callbacks

### Audio
- ✅ `useAudio` hook for ambient sounds
- ✅ Mute toggle in UI
- ✅ Volume control (default -20 dB)

### Performance
- ✅ Video preloading with `preload="auto"`
- ✅ Proper cleanup and disposal
- ✅ Color space configuration
- ✅ Texture optimization

## 📝 Phase 5 — Content & Polish (In Progress)

### Typography & UI
- ✅ Brand label ("AIR FAIR")
- ✅ Nav chips (AJ1/AJ3/AJ12)
- ✅ Story panels with athlete copy
- ⏳ Museum-tone narration (optional)

### Content
- ⏳ Video loops for all 3 silhouettes
- ⏳ GLTF models for AJ12 (and optional others)
- ⏳ 3-5 detailed annotations per PE
- ⏳ Materials and story callouts

## 🚀 Phase 6 — Packaging (Next)

### Live Deployment
- ⏳ Vercel deployment
- ⏳ Production build optimization
- ⏳ Performance testing

### Documentation
- ✅ Component documentation
- ✅ Asset checklist
- ⏳ Case study (1-pager)
- ⏳ GIF embeds of each PERIOR mode

### Demo
- ⏳ 30-45s screen-recorded walkthrough
- ⏳ Show all three modes in sequence
- ⏳ Highlight interactions and transitions

## Asset Status

### Videos (Public/pe/)
- ⏳ carmelo-anthony.mp4
- ⏳ westbrook.mp4
- ⏳ ray-allen.mp4

### Models (Public/models/)
- ⏳ aj12-ray-allen.glb
- ⏳ aj1-carmelo.glb (optional)
- ⏳ aj3-westbrook.glb (optional)

### Audio (Public/audio/)
- ⏳ court-ambience.mp3

## Technical Stack

- **React** + **TypeScript**
- **Vite** for build/dev
- **Three.js r158** for 3D
- **GSAP 3.12** for animations
- **GLTFLoader** for models
- **CSS2DRenderer** for labels

## Performance Targets

- Initial load: < 3s
- Model load: < 2s per GLTF
- Video streaming: Immediate playback
- Frame rate: Stable 60 FPS
- Memory: < 200MB total

## Next Steps

1. **Add video assets** to test scrim mode
2. **Load GLTF model** for lightbox
3. **Write story annotations** for each PE
4. **Record demo video**
5. **Deploy to Vercel**
6. **Create case study document**




