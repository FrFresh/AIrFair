import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  onReady?: (api: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    addSneaker: (x: number, pedestalColor?: string, shoeColor?: string, accentColor?: string) => THREE.Mesh;
  }) => void;
  onSelect?: (id: string) => void;
};

// Maps shoe mesh uuid → silhouette id for click detection
const shoeMap = new Map<string, string>();
const SHOE_IDS = ['aj1', 'aj3', 'aj12'];

export default function ThreeMuseum({ onReady, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationRef = useRef<number>();
  const clickableMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = containerRef.current!;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.FogExp2(0x111111, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 7);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.75 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 10),
      new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 })
    );
    backWall.position.set(0, 4, -3);
    scene.add(backWall);

    // Ambient — bright enough to read the shoe colors clearly
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    // Hemisphere light: warm from above, cool bounce from below
    const hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 0.5);
    scene.add(hemi);

    // Main overhead spot
    const mainSpot = new THREE.SpotLight(0xffffff, 6, 25, Math.PI / 4, 0.35, 1);
    mainSpot.position.set(0, 8, 5);
    mainSpot.target.position.set(0, 0, 0);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    scene.add(mainSpot);
    scene.add(mainSpot.target);

    // Side fill lights so left/right shoes aren't in shadow
    const fillL = new THREE.PointLight(0xffffff, 1.5, 20);
    fillL.position.set(-6, 4, 3);
    scene.add(fillL);

    const fillR = new THREE.PointLight(0xffffff, 1.5, 20);
    fillR.position.set(6, 4, 3);
    scene.add(fillR);

    // Per-pedestal accent lights (added during addSneaker)
    let shoeIndex = 0;

    const addSneaker = (
      x: number,
      pedestalColor = '#1a1a1a',
      shoeColor = '#eeeeee',
      accentColor = '#ffffff'
    ) => {
      const id = SHOE_IDS[shoeIndex] ?? `shoe-${shoeIndex}`;
      shoeIndex++;

      // Pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.7, 0.15, 48),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(pedestalColor),
          metalness: 0.6,
          roughness: 0.3,
        })
      );
      ped.position.set(x, 0.075, 0);
      ped.receiveShadow = true;
      ped.castShadow = true;
      scene.add(ped);

      // Pedestal top ring (accent glow)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.025, 8, 48),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(accentColor),
          emissive: new THREE.Color(accentColor),
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.155, 0);
      scene.add(ring);

      // Shoe sole (flat base)
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.1, 2.4),
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          metalness: 0.1,
          roughness: 0.8,
        })
      );
      sole.position.set(x, 0.22, 0);
      sole.castShadow = true;
      scene.add(sole);

      // Shoe midsole
      const midsole = new THREE.Mesh(
        new THREE.BoxGeometry(0.98, 0.18, 2.25),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(shoeColor).lerp(new THREE.Color(0xffffff), 0.6),
          metalness: 0.15,
          roughness: 0.6,
        })
      );
      midsole.position.set(x, 0.36, 0);
      midsole.castShadow = true;
      scene.add(midsole);

      // Shoe upper (main body)
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.42, 2.0),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(shoeColor),
          metalness: 0.2,
          roughness: 0.5,
          emissive: new THREE.Color(shoeColor),
          emissiveIntensity: 0.04,
        })
      );
      upper.position.set(x, 0.62, -0.05);
      upper.castShadow = true;
      scene.add(upper);

      // Toe box (front angled piece)
      const toe = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.22, 0.5),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(shoeColor),
          metalness: 0.2,
          roughness: 0.5,
        })
      );
      toe.position.set(x, 0.48, 0.9);
      toe.rotation.x = -0.25;
      toe.castShadow = true;
      scene.add(toe);

      // Heel
      const heel = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 0.55, 0.45),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(shoeColor).lerp(new THREE.Color(0x000000), 0.1),
          metalness: 0.15,
          roughness: 0.5,
        })
      );
      heel.position.set(x, 0.58, -1.0);
      heel.castShadow = true;
      scene.add(heel);

      // Accent light under shoe
      const accentLight = new THREE.PointLight(new THREE.Color(accentColor), 2.5, 5);
      accentLight.position.set(x, 0.3, 0);
      scene.add(accentLight);

      // Register upper for click detection
      shoeMap.set(upper.uuid, id);
      clickableMeshes.current.push(upper);

      return upper;
    };

    // Click / raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes.current);
      if (hits.length > 0) {
        const id = shoeMap.get(hits[0].object.uuid);
        if (id && onSelect) onSelect(id);
      }
    };
    container.addEventListener('click', handleClick);

    // Resize
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Render loop
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      mainSpot.position.x = Math.sin(t * 0.4) * 2;
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();

    onReady?.({ scene, camera, renderer, addSneaker });

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      shoeMap.clear();
      clickableMeshes.current = [];
    };
  }, [onReady, onSelect]);

  return (
    <div
      className="stage"
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'pointer' }}
    />
  );
}
