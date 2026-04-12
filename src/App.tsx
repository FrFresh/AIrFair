import { useState, useEffect } from 'react';
import ThreeMuseum from './components/ThreeMuseum';
import SneakerRoom from './components/SneakerRoom';
import { SILHOUETTES, Silhouette } from './data/silhouettes';
import { moveCameraTo } from './lib/camera';
import './App.css';

function App() {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState<Silhouette | null>(null);

  // Place shoes and default to AJ1 when scene is ready
  useEffect(() => {
    if (!api) return;

    SILHOUETTES.forEach((s, i) => {
      const x = [-4, 0, 4][i];
      const shoe = api.addSneaker(x, s.pedestalColor, s.shoeColor, s.accentColor);
      const startY = shoe.position.y;
      let frame: number;
      const animate = () => {
        shoe.rotation.y += 0.005;
        shoe.position.y = startY + Math.sin(Date.now() * 0.001 + i * 2) * 0.05;
        frame = requestAnimationFrame(animate);
      };
      animate();
    });

    // Default to AJ1 on load
    const timer = setTimeout(() => handleNav('aj1'), 400);
    return () => clearTimeout(timer);
  }, [api]);

  const handleNav = (id: 'aj1' | 'aj3' | 'aj12') => {
    const silhouette = SILHOUETTES.find(s => s.id === id);
    if (!silhouette || !api) return;
    setCurrent(silhouette);
    moveCameraTo(api.camera, id);
  };

  return (
    <div className="app">
      <div className="brand-label">AIR FAIR</div>

      <nav className="nav">
        {SILHOUETTES.map(s => (
          <button
            key={s.id}
            className={current?.id === s.id ? 'active' : ''}
            onClick={() => handleNav(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ThreeMuseum
          onReady={setApi}
          onSelect={(id) => handleNav(id as 'aj1' | 'aj3' | 'aj12')}
        />

        {current && (
          <SneakerRoom
            current={current}
            onClose={() => {
              setCurrent(null);
              if (api?.camera) moveCameraTo(api.camera, 'entrance');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
