import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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

type SceneApi = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  addSneaker: (x: number, p?: string, s?: string, a?: string) => THREE.Mesh;
};

export default function App() {
  const [api, setApi] = useState<SceneApi | null>(null);
  const [current, setCurrent] = useState<Silhouette | null>(null);

  const scrimRef  = useRef<ProjectionScrimHandle>(null);
  const panelsRef = useRef<RevealPanelsHandle>(null);

  // ── Place shoes + default selection ─────────────────────────────────────

  useEffect(() => {
    if (!api) return;

    SILHOUETTES.forEach((s, i) => {
      const x = [-4, 0, 4][i];
      const shoe = api.addSneaker(x, s.pedestalColor, s.shoeColor, s.accentColor);
      const startY = shoe.position.y;
      const loop = () => {
        shoe.rotation.y += 0.005;
        shoe.position.y = startY + Math.sin(Date.now() * 0.001 + i * 2) * 0.05;
        requestAnimationFrame(loop);
      };
      loop();
    });

    const t = setTimeout(() => handleNav('aj1'), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNav = (id: 'aj1' | 'aj3' | 'aj12') => {
    const silhouette = SILHOUETTES.find(s => s.id === id);
    if (!silhouette || !api) return;

    setCurrent(silhouette);
    moveCameraTo(api.camera, id);
    applyAtmosphere(api.scene, silhouette.accentColor);
  };

  const handleClose = () => {
    setCurrent(null);
    if (api) {
      moveCameraTo(api.camera, 'entrance');
      resetAtmosphere(api.scene);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Three.js canvas — position:fixed fills viewport from inside ThreeMuseum */}
      <ThreeMuseum
        onReady={setApi}
        onSelect={id => handleNav(id as 'aj1' | 'aj3' | 'aj12')}
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
      <div className="brand-label">AIR FAIR</div>

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
        />
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
