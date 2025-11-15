import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  onReady?: (api: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    addSneaker: (x: number, color?: string) => THREE.Mesh;
  }) => void;
};

export default function ThreeMuseum({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const sceneRef = useRef<THREE.Scene>();
  const animationRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    container.appendChild(renderer.domElement);

    // Room: floor + back wall
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 6),
      new THREE.MeshStandardMaterial({ color: 0x0e0e0e, metalness: 0.05, roughness: 0.95 })
    );
    backWall.position.set(0, 3, -2);
    scene.add(backWall);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(amb);

    const spot = new THREE.SpotLight(0xffffff, 1.2, 12, Math.PI / 5, 0.5, 1.2);
    spot.position.set(0, 5, 3);
    spot.castShadow = true;
    scene.add(spot);

    // API
    const addSneaker = (x: number, color = '#1b1b1b') => {
      // Pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      ped.position.set(x, 0.2, 0);
      ped.castShadow = true;
      ped.receiveShadow = true;
      scene.add(ped);

      // Placeholder "sneaker"
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.35, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.3, roughness: 0.4 })
      );
      shoe.position.set(x, 0.6, 0);
      shoe.castShadow = true;
      scene.add(shoe);
      return shoe;
    };

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      spot.position.x = Math.sin(t * 0.5) * 1.5; // subtle light sway
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    onReady?.({ scene, camera, renderer, addSneaker });

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [onReady]);

  return (
    <div className="stage" ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
