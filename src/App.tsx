import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import ThreeMuseum from './components/ThreeMuseum';
import SneakerRoom from './components/SneakerRoom';
import ProjectionScrim, { ProjectionScrimHandle } from './components/ProjectionScrim';
import RevealPanels, { RevealPanelsHandle } from './components/RevealPanels';
import { SILHOUETTES, Silhouette } from './data/silhouettes';
import { ShowcaseMode } from './types/showcase';
import { moveCameraTo } from './lib/camera';
import './App.css';

/*
 * LightboxPE is intentionally not rendered here.
 * It creates a white-box room at world origin which visually conflicts with the
 * dark museum environment. To enable it, it needs its own isolated Three.js
 * renderer (canvas + scene) separate from ThreeMuseum. When /public/models/
 * aj12-ray-allen.glb exists, create a dedicated <canvas> for the lightbox view
 * and mount LightboxPE into that scene instead.
 */

type SneakerOpts = { displayNumber?: string; year?: number; shoeImage?: string; modelPath?: string };

type SceneApi = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  addSneaker: (x: number, p?: string, s?: string, a?: string, opts?: SneakerOpts) => THREE.Object3D;
  updatePlacard: (shoeId: string, imageUrl?: string) => void;
};

export default function App() {
  const [api, setApi] = useState<SceneApi | null>(null);
  const [current, setCurrent] = useState<Silhouette | null>(null);
  const [phase, setPhase] = useState<'intro' | 'gallery'>('intro');
  const [doorOpening, setDoorOpening] = useState(false);
  const [introFading, setIntroFading] = useState(false);

  // Keep a ref so stable callbacks (useCallback []) can always read the latest api
  const apiRef = useRef<SceneApi | null>(null);

  const scrimRef  = useRef<ProjectionScrimHandle>(null);
  const panelsRef = useRef<RevealPanelsHandle>(null);

  // ── Navigation ───────────────────────────────────────────────────────────
  // useCallback with [] so the reference never changes — ThreeMuseum's
  // onSelect won't trigger a scene rebuild when the parent re-renders.
  // apiRef always holds the latest api even with empty deps.

  const handleNav = useCallback((id: string) => {
    const silhouette = SILHOUETTES.find(s => s.id === id);
    if (!silhouette || !apiRef.current) return;
    setCurrent(silhouette);
    moveCameraTo(apiRef.current.camera, silhouette.id);
    applyAtmosphere(apiRef.current.scene, silhouette.accentColor);
    // Show first PE's player photo (or default canvas if none)
    apiRef.current.updatePlacard(silhouette.id, silhouette.pes[0]?.playerImage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePEChange = useCallback((shoeId: string, imageUrl?: string) => {
    apiRef.current?.updatePlacard(shoeId, imageUrl);
  }, []);

  const handleIntroClick = useCallback(() => {
    if (doorOpening) return;
    setDoorOpening(true);
    // Doors swing open (1.2s), then frame fades out, then gallery loads
    setTimeout(() => setIntroFading(true), 1100);
    setTimeout(() => {
      setPhase('gallery');
      handleNav('aj1');
    }, 1700);
  }, [doorOpening]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setCurrent(null);
    if (apiRef.current) {
      moveCameraTo(apiRef.current.camera, 'entrance');
      resetAtmosphere(apiRef.current.scene);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const ZOOM_MIN = 1.0;
  const ZOOM_MAX = 9.0;

  const adjustZoom = useCallback((delta: number) => {
    const cam = apiRef.current?.camera;
    if (!cam) return;
    const newZ = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cam.position.z + delta));
    gsap.to(cam.position, { z: newZ, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  // Scroll-wheel zoom — active whenever the scene is ready
  useEffect(() => {
    if (!api) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      adjustZoom(e.deltaY * 0.006);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [api, adjustZoom]);

  // ── Place shoes when Three.js scene is ready ─────────────────────────────

  useEffect(() => {
    if (!api) return;
    apiRef.current = api; // sync ref whenever state updates

    SILHOUETTES.forEach((s, i) => {
      const x = [-4, 0, 4][i];
      const shoe = api.addSneaker(x, s.pedestalColor, s.shoeColor, s.accentColor, {
        displayNumber: s.title.split(' ').pop() ?? '',
        year: s.year,
        shoeImage: s.shoeImage,
        modelPath: s.modelPath,
      });
      const startY = shoe.position.y;
      const loop = () => {
        shoe.rotation.y += 0.005;
        shoe.position.y = startY + Math.sin(Date.now() * 0.001 + i * 2) * 0.05;
        requestAnimationFrame(loop);
      };
      loop();
    });

  }, [api, handleNav]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Three.js canvas — position:fixed fills viewport from inside ThreeMuseum */}
      <ThreeMuseum
        onReady={setApi}
        onSelect={handleNav}
      />

      {/* ── Showcase overlays ───────────────────────────────────────────── */}

      {/* AJ1 — Scrim: translucent colored curtain added to the 3D scene */}
      {api && current?.showcaseMode === ShowcaseMode.Scrim && (
        <ProjectionScrim
          ref={scrimRef}
          src={current.videoPath ?? ''}
          fallbackColor={current.accentColor}
          scene={api.scene}
          position={[-4, 1.5, -0.8]}
          size={{ w: 3.2, h: 2.4 }}
          auto
        />
      )}

      {/* AJ3 — Panels: three sliding glass panels in the 3D scene */}
      {api && current?.showcaseMode === ShowcaseMode.Panels && (
        <RevealPanels
          ref={panelsRef}
          videoSrc={current.videoPath ?? ''}
          fallbackColor={current.accentColor}
          scene={api.scene}
          camera={api.camera}
          currentId={current.id}
        />
      )}

      {/* AJ12 — Lightbox: scene atmosphere (green tint) is applied via
          applyAtmosphere(). Full LightboxPE requires /public/models/aj12-ray-allen.glb
          and a dedicated renderer — see note at top of file. */}

      {/* ── UI layer ────────────────────────────────────────────────────── */}
      {/* ── Intro entrance screen — animated doors ──────────────── */}
      {phase === 'intro' && (
        <div
          className={`intro-screen${introFading ? ' fading' : ''}`}
          onClick={handleIntroClick}
        >
          <div className={`intro-door-left${doorOpening ? ' opening' : ''}`}>
            <img src="/images/ui/entryway2.png" alt="" />
          </div>
          <div className={`intro-door-right${doorOpening ? ' opening' : ''}`}>
            <img src="/images/ui/entryway2.png" alt="" />
          </div>
          {!doorOpening && <div className="intro-prompt">Click to Enter</div>}
        </div>
      )}

      <div className="brand-label">AIR FAIR</div>

      {/* All gallery UI — hidden until user enters */}
      {phase === 'gallery' && (
        <>
          {api && (
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={() => adjustZoom(-1.2)} aria-label="Zoom in">+</button>
              <button className="zoom-btn" onClick={() => adjustZoom(1.2)} aria-label="Zoom out">−</button>
            </div>
          )}

          <nav className="nav">
            {SILHOUETTES.map(s => (
              <button
                key={s.id}
                className={current?.id === s.id ? 'active' : ''}
                style={
                  current?.id === s.id
                    ? ({ '--accent': s.accentColor } as React.CSSProperties)
                    : undefined
                }
                onClick={() => handleNav(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>

          {current && (
            <SneakerRoom
              current={current}
              onClose={handleClose}
              onPEChange={(pe) => handlePEChange(current.id, pe.playerImage)}
            />
          )}
        </>
      )}
    </>
  );
}

// ── Scene atmosphere helpers ────────────────────────────────────────────────

/** Tint scene background ~6% toward the shoe's accent color for identity. */
function applyAtmosphere(scene: THREE.Scene, accentHex: string) {
  const accent = new THREE.Color(accentHex);
  const base   = new THREE.Color(0x0d0d0d);
  const tinted = base.clone().lerp(accent, 0.06);
  scene.background = tinted;
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(tinted);
}

function resetAtmosphere(scene: THREE.Scene) {
  const base = new THREE.Color(0x0d0d0d);
  scene.background = base;
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(base);
}
