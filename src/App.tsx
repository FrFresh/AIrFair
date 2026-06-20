import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import ThreeMuseum from './components/ThreeMuseum';
import SneakerRoom from './components/SneakerRoom';
import { SILHOUETTES, Silhouette } from './data/silhouettes';
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

type SneakerOpts = { displayNumber?: string; year?: number; shoeImage?: string; modelPath?: string; mirrorToPair?: boolean; singleFromPair?: boolean };

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
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFading, setWelcomeFading] = useState(false);

  // Keep refs so stable callbacks (useCallback []) can always read latest state
  const apiRef     = useRef<SceneApi | null>(null);
  const currentRef = useRef<Silhouette | null>(null);

  // ── Navigation ───────────────────────────────────────────────────────────
  // useCallback with [] so the reference never changes — ThreeMuseum's
  // onSelect won't trigger a scene rebuild when the parent re-renders.
  // apiRef always holds the latest api even with empty deps.

  const handleNav = useCallback((id: string) => {
    const silhouette = SILHOUETTES.find(s => s.id === id);
    if (!silhouette || !apiRef.current) return;
    setCurrent(silhouette);
    currentRef.current = silhouette;
    moveCameraTo(apiRef.current.camera, silhouette.id);
    applyAtmosphere(apiRef.current.scene, silhouette.accentColor);
    // Show first PE's player photo (or default canvas if none)
    apiRef.current.updatePlacard(silhouette.id, silhouette.pes[0]?.playerImage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePEChange = useCallback((shoeId: string, imageUrl?: string) => {
    apiRef.current?.updatePlacard(shoeId, imageUrl);
  }, []);

  // One gesture: clicking the welcome both fades it out AND swings the doors
  // open at the same time, then the frame fades and the gallery loads.
  const handleWelcomeClick = useCallback(() => {
    if (welcomeFading) return;
    setWelcomeFading(true);   // welcome dissolves (0.6s) …
    setDoorOpening(true);     // … revealing the doors already swinging open (1.2s)
    setTimeout(() => setShowWelcome(false), 600);   // remove the faded welcome
    setTimeout(() => setIntroFading(true), 1300);    // fade the door frame after they open
    setTimeout(() => {
      setPhase('gallery');
      handleNav('aj1');
    }, 1900);
  }, [welcomeFading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setCurrent(null);
    currentRef.current = null;
    if (apiRef.current) {
      moveCameraTo(apiRef.current.camera, 'entrance');
      resetAtmosphere(apiRef.current.scene);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipe left/right cycles through shoes — used by ThreeMuseum's touch handler
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const ids = SILHOUETTES.map(s => s.id);
    const idx = currentRef.current ? ids.indexOf(currentRef.current.id) : -1;
    const next = direction === 'left'
      ? ids[(idx + 1) % ids.length]
      : ids[(idx - 1 + ids.length) % ids.length];
    handleNav(next);
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
      const x = [-8, 0, 8][i];
      const shoe = api.addSneaker(x, s.pedestalColor, s.shoeColor, s.accentColor, {
        displayNumber: s.title.split(' ').pop() ?? '',
        year: s.year,
        shoeImage: s.shoeImage,
        modelPath: s.modelPath,
        mirrorToPair: s.singleShoeModel,
        singleFromPair: s.singleFromPair,
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
        onSwipe={handleSwipe}
      />

      {/* Per-shoe atmosphere tint is applied via applyAtmosphere() in handleNav.
          The old Scrim/Panels showcase overlays were removed — they only drew
          flat fallback color planes (no video assets) that cluttered the scene. */}

      {/* ── UI layer ────────────────────────────────────────────────────── */}
      {/* ── Welcome splash — shown before the doors ──────────────── */}
      {phase === 'intro' && showWelcome && (
        <div
          className={`welcome-screen${welcomeFading ? ' fading' : ''}`}
          onClick={handleWelcomeClick}
        >
          <h1 className="welcome-title">
            <span className="welcome-title-sm">Welcome to</span>
            <span className="welcome-title-lg">Air Fair</span>
          </h1>
          <div className="welcome-prompt">Click to Enter</div>
        </div>
      )}

      {/* ── Intro entrance screen — animated doors ──────────────────
          Rendered for the whole intro phase so the doors sit UNDERNEATH
          the welcome splash (welcome z210 > doors z200). When the welcome
          fades it reveals the doors, not the 3D interior. Door clicks are
          disabled until the welcome is gone. */}
      {phase === 'intro' && (
        <div className={`intro-screen${introFading ? ' fading' : ''}`}>
          <div className={`intro-door-left${doorOpening ? ' opening' : ''}`}>
            <img src="/images/ui/entryway2.png" alt="" />
          </div>
          <div className={`intro-door-right${doorOpening ? ' opening' : ''}`}>
            <img src="/images/ui/entryway2.png" alt="" />
          </div>
        </div>
      )}

      <div className="brand-label">
        <span className="brand-word">Air</span>
        <span className="jumpman-mark brand-jump" aria-hidden="true" />
        <span className="brand-word">Fair</span>
      </div>

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
              onPrev={() => handleSwipe('right')}
              onNext={() => handleSwipe('left')}
            />
          )}

          {/* Swipe hint — only visible on touch devices via CSS media query */}
          {!current && (
            <div className="swipe-hint">← swipe to explore →</div>
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
  const base   = new THREE.Color(0x140f0a);
  const tinted = base.clone().lerp(accent, 0.06);
  scene.background = tinted;
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(tinted);
}

function resetAtmosphere(scene: THREE.Scene) {
  const base = new THREE.Color(0x140f0a);
  scene.background = base;
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(base);
}
