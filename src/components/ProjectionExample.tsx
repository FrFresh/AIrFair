import { useEffect, useState } from 'react';
import * as THREE from 'three';
import ThreeMuseum from './ThreeMuseum';
import ProjectionScrim from './ProjectionScrim';

/**
 * Example usage of ProjectionScrim component
 * This shows how to integrate a video projection into the museum scene
 */
export default function ProjectionExample() {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [showProjection, setShowProjection] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
        <button
          onClick={() => setShowProjection(!showProjection)}
          style={{
            background: '#d61f29',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {showProjection ? 'Hide' : 'Show'} Projection
        </button>
      </div>

      <ThreeMuseum
        onReady={(api) => {
          setScene(api.scene);
        }}
      />

      {scene && showProjection && (
        <ProjectionScrim
          src="/pe/ray-allen.mp4"
          title="Sugar Ray PE"
          subtitle="Air Jordan 12"
          scene={scene}
          opacity={0.95}
        />
      )}
    </div>
  );
}




