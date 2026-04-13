import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { moveCameraTo } from '../lib/camera';

export interface RevealPanelsProps {
  videoSrc: string;
  /** Hex color used for panels when videoSrc is empty or video fails to load. */
  fallbackColor?: string;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  currentId: 'aj1' | 'aj3' | 'aj12';
}

export interface RevealPanelsHandle {
  open: () => Promise<void>;
}

/**
 * RevealPanels
 * - Creates three translucent planes in the 3D scene.
 * - Plays a VideoTexture if `videoSrc` resolves; falls back to `fallbackColor` panels.
 * - `open()` runs the spread animation then flies the camera in.
 * - Memory-safe: sync interval is stored in a ref and cleared on unmount.
 */
const RevealPanels = forwardRef<RevealPanelsHandle, RevealPanelsProps>(
  ({ videoSrc, fallbackColor = '#888888', scene, camera, currentId }, ref) => {

  const meshesRef       = useRef<THREE.Mesh[]>([]);
  const materialsRef    = useRef<THREE.MeshStandardMaterial[]>([]);
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const textureRef      = useRef<THREE.VideoTexture | null>(null);
  // FIX: store interval in ref so cleanup can always clear it (was a memory leak)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Imperative handle ──────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    open: async () => {
      if (!meshesRef.current.length) return;

      // Reset to starting positions
      meshesRef.current.forEach((mesh, i) => {
        gsap.set(mesh.position, { x: [-1.3, 0, 1.3][i] });
        gsap.set(mesh.material as THREE.MeshStandardMaterial, { opacity: 0.5 });
      });

      // Spread panels + fade up opacity simultaneously
      const tl = gsap.timeline();
      meshesRef.current.forEach((mesh, i) => {
        tl.to(mesh.position, {
          x: [-2.4, 0, 2.4][i],
          duration: 1.5,
          ease: 'power2.inOut',
        }, 0);
        tl.to(mesh.material as THREE.MeshStandardMaterial, {
          opacity: 0.85,
          duration: 1.0,
          ease: 'power2.inOut',
        }, 0);
      });

      await tl;
      moveCameraTo(camera, currentId);
    },
  }));

  // ── Spawn panels (shared by video + fallback paths) ────────────────────

  const spawnPanels = (texture?: THREE.VideoTexture) => {
    const color = new THREE.Color(fallbackColor);
    const positions = [-1.3, 0, 1.3];

    positions.forEach((x) => {
      const material = new THREE.MeshStandardMaterial({
        ...(texture
          ? { map: texture }
          : { color, emissive: color, emissiveIntensity: 0.2 }),
        transparent: true,
        opacity:     0.7,
        side:        THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 4), material);
      mesh.position.set(x, 2, -2);
      mesh.rotation.y = Math.PI;
      scene.add(mesh);
      meshesRef.current.push(mesh);
      materialsRef.current.push(material);
    });
  };

  // ── Setup: try video, fallback to color ────────────────────────────────

  useEffect(() => {
    if (!scene) return;

    if (!videoSrc) {
      spawnPanels();
      return () => cleanupPanels(scene, meshesRef, materialsRef, syncIntervalRef);
    }

    const video = document.createElement('video');
    video.src       = videoSrc;
    video.loop      = true;
    video.muted     = true;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    videoRef.current = video;

    const onLoaded = () => {
      video.play().catch(() => {});
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      textureRef.current = texture;
      spawnPanels(texture);

      // FIX: store interval ref so cleanup can always clear it
      syncIntervalRef.current = setInterval(() => {
        if (textureRef.current) textureRef.current.needsUpdate = true;
      }, 1000 / 30);
    };

    const onError = () => {
      // Video file not found or failed — render color panels instead
      spawnPanels();
    };

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
    video.load();

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
      video.pause();
      video.src = '';
      videoRef.current = null;
      if (textureRef.current) { textureRef.current.dispose(); textureRef.current = null; }
      cleanupPanels(scene, meshesRef, materialsRef, syncIntervalRef);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc, scene]);

  return null;
});

// ── Cleanup helper ──────────────────────────────────────────────────────────

function cleanupPanels(
  scene: THREE.Scene,
  meshesRef:    React.MutableRefObject<THREE.Mesh[]>,
  materialsRef: React.MutableRefObject<THREE.MeshStandardMaterial[]>,
  intervalRef:  React.MutableRefObject<ReturnType<typeof setInterval> | null>
) {
  if (intervalRef.current !== null) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  meshesRef.current.forEach(m => {
    scene.remove(m);
    m.geometry.dispose();
  });
  materialsRef.current.forEach(m => m.dispose());
  meshesRef.current    = [];
  materialsRef.current = [];
}

RevealPanels.displayName = 'RevealPanels';
export default RevealPanels;
