import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeMuseum from './components/ThreeMuseum';
import SneakerRoom from './components/SneakerRoom';
import ProjectionScrim, { ProjectionScrimHandle } from './components/ProjectionScrim';
import RevealPanels, { RevealPanelsHandle } from './components/RevealPanels';
import LightboxPE from './components/LightboxPE';
import { SILHOUETTES, Silhouette } from './data/silhouettes';
import { ShowcaseMode } from './types/showcase';
import { AJ12_ANNOTATIONS } from './data/annotations';
import { useShowcaseState } from './hooks/useShowcaseState';
import { useAudio } from './hooks/useAudio';
import { moveCameraTo } from './lib/camera';
import './App.css';

function App() {
  const [api, setApi] = useState<any>(null);
  const { state, selectSilhouette } = useShowcaseState();
  const { isMuted, toggleMute } = useAudio('/audio/court-ambience.mp3', 0.15);
  
  const scrimRef = useRef<ProjectionScrimHandle>(null);
  const panelsRef = useRef<RevealPanelsHandle>(null);

  // Setup sneakers when scene is ready
  useEffect(() => {
    if (!api) return;

    const { scene, addSneaker } = api;

    const sneakers = [
      { x: -4, color: SILHOUETTES[0].pedestalColor },
      { x: 0, color: SILHOUETTES[1].pedestalColor },
      { x: 4, color: SILHOUETTES[2].pedestalColor }
    ];

    sneakers.forEach(({ x, color }) => {
      const sneaker = addSneaker(x, color);
      
      const startY = sneaker.position.y;
      const animate = () => {
        sneaker.rotation.y += 0.005;
        sneaker.position.y = startY + Math.sin(Date.now() * 0.001) * 0.05;
        requestAnimationFrame(animate);
      };
      animate();
    });
  }, [api]);

  const handleNav = async (id: 'aj1' | 'aj3' | 'aj12') => {
    const silhouette = SILHOUETTES.find(s => s.id === id);
    if (!silhouette) return;

    await selectSilhouette(
      silhouette,
      async () => {
        // Fade out scrim
        if (scrimRef.current && state.mode === ShowcaseMode.Scrim) {
          await scrimRef.current.fadeOut();
        }
      },
      async () => {
        // Open panels (if in panels mode)
        if (panelsRef.current && api?.camera) {
          await panelsRef.current.open();
          moveCameraTo(api.camera, id);
        }
      }
    );

    // Fade in scrim if in scrim mode
    if (silhouette.showcaseMode === ShowcaseMode.Scrim) {
      setTimeout(() => scrimRef.current?.fadeIn(), 200);
    }
  };

  return (
    <div className="app">
      {/* Upper-left label */}
      <div className="brand-label">
        AIR FAIR
      </div>

      {/* Navigation */}
      <nav className="nav">
        <button onClick={() => handleNav('aj1')}>Air Jordan 1</button>
        <button onClick={() => handleNav('aj3')}>Air Jordan 3</button>
        <button onClick={() => handleNav('aj12')}>Air Jordan 12</button>
      </nav>

      {/* Audio toggle */}
      <button className="audio-toggle" onClick={toggleMute}>
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Main scene */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ThreeMuseum onReady={setApi} />
        
        {state.currentSilhouette && <SneakerRoom current={state.currentSilhouette} />}

        {/* Projection Scrim (AJ1) */}
        {state.mode === ShowcaseMode.Scrim && state.currentSilhouette && state.currentSilhouette.videoPath && api && (
          <ProjectionScrim
            ref={scrimRef}
            src={state.currentSilhouette.videoPath}
            title={state.currentSilhouette.pe.peName}
            subtitle={state.currentSilhouette.title}
            scene={api.scene}
            position={[0, 3, -1.8]}
          />
        )}

        {/* Reveal Panels (AJ3) */}
        {state.mode === ShowcaseMode.Panels && state.currentSilhouette && state.currentSilhouette.videoPath && api && (
          <RevealPanels
            ref={panelsRef}
            videoSrc={state.currentSilhouette.videoPath}
            scene={api.scene}
            camera={api.camera}
            currentId={state.currentSilhouette.id}
          />
        )}

        {/* Lightbox PE (AJ12) */}
        {state.mode === ShowcaseMode.Lightbox && state.currentSilhouette && state.currentSilhouette.modelPath && api && (
          <LightboxPE
            modelPath={state.currentSilhouette.modelPath}
            annotations={AJ12_ANNOTATIONS}
            scene={api.scene}
            camera={api.camera}
            renderer={api.renderer}
          />
        )}
      </div>
    </div>
  );
}

export default App;
