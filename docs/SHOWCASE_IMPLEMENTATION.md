# Showcase Implementation Guide

Complete implementation of the three showcase modes for Air Fair museum.

## Components Created

### 1. ProjectionScrim (Fastest Win) ✅

**File**: `src/components/ProjectionScrim.tsx`

**Features**:
- Custom shader material with `uVideo`, `uTime`, `uOpacity`
- React hook for VideoTexture creation and playback
- `fadeIn()` / `fadeOut()` methods for smooth transitions
- Starts at opacity 0, fades in on route change

### 2. RevealPanels (Camera Push) ✅

**File**: `src/components/RevealPanels.tsx`

**Features**:
- Three planes using shared VideoTexture
- `sync()` method keeps video times aligned
- `open()` GSAP timeline with X-position and opacity animations
- Camera transition after panels open

### 3. LightboxPE (Annotations) ✅

**File**: `src/components/LightboxPE.tsx`

**Features**:
- Loads GLTF models
- CSS2DRenderer for annotation labels
- `focus(id)` utility for camera animation
- GSAP camera transitions with offset

## Testing

All three components are integrated in App.tsx. Visit http://localhost:5174 to test.




