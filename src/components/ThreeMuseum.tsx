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
  const animationRef = useRef<number>();
  const clickableMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = containerRef.current!;

    // Use window dimensions as a reliable fallback if element reports 0
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    scene.fog = new THREE.Fog(0x0d0d0d, 18, 32);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 2, 9);
    camera.lookAt(0, 0.5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ── Environment ──────────────────────────────────────────────

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.35, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 12),
      new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 })
    );
    backWall.position.set(0, 5, -4);
    scene.add(backWall);

    // ── Lighting ─────────────────────────────────────────────────

    // Ambient — enough to see shapes clearly
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    // Hemisphere: warm sky / cool ground
    scene.add(new THREE.HemisphereLight(0xfff0e0, 0x223344, 0.6));

    // Main overhead spot covering all three pedestals
    const mainSpot = new THREE.SpotLight(0xffffff, 8, 30, Math.PI / 3.5, 0.3, 1);
    mainSpot.position.set(0, 10, 6);
    mainSpot.target.position.set(0, 0, 0);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.set(2048, 2048);
    scene.add(mainSpot);
    scene.add(mainSpot.target);

    // Left fill (AJ1 side)
    const fillL = new THREE.PointLight(0xffffff, 3, 20);
    fillL.position.set(-7, 5, 4);
    scene.add(fillL);

    // Right fill (AJ12 side)
    const fillR = new THREE.PointLight(0xffffff, 3, 20);
    fillR.position.set(7, 5, 4);
    scene.add(fillR);

    // ── Shoe builder ─────────────────────────────────────────────

    let shoeIndex = 0;

    const addSneaker = (
      x: number,
      pedestalColor = '#2a2a2a',
      shoeColor = '#eeeeee',
      accentColor = '#ffffff'
    ) => {
      const id = SHOE_IDS[shoeIndex] ?? `shoe-${shoeIndex}`;
      shoeIndex++;

      const shoe3D = new THREE.Color(shoeColor);
      const accent3D = new THREE.Color(accentColor);

      // ── Pedestal ──
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.75, 0.18, 64),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(pedestalColor),
          metalness: 0.7,
          roughness: 0.25,
        })
      );
      ped.position.set(x, 0.09, 0);
      ped.receiveShadow = true;
      ped.castShadow = true;
      scene.add(ped);

      // Glowing accent ring on top of pedestal
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.03, 12, 64),
        new THREE.MeshStandardMaterial({
          color: accent3D,
          emissive: accent3D,
          emissiveIntensity: 1.2,
          metalness: 0.9,
          roughness: 0.1,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.185, 0);
      scene.add(ring);

      // ── Shoe geometry (3-part silhouette) ──

      // Outsole
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.1, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.85 })
      );
      sole.position.set(x, 0.24, 0);
      sole.castShadow = true;
      scene.add(sole);

      // Midsole (lighter version of shoe color)
      const midsole = new THREE.Mesh(
        new THREE.BoxGeometry(1.02, 0.22, 2.3),
        new THREE.MeshStandardMaterial({
          color: shoe3D.clone().lerp(new THREE.Color(0xffffff), 0.55),
          metalness: 0.1,
          roughness: 0.6,
          emissive: shoe3D.clone().lerp(new THREE.Color(0xffffff), 0.55),
          emissiveIntensity: 0.15,
        })
      );
      midsole.position.set(x, 0.4, 0);
      midsole.castShadow = true;
      scene.add(midsole);

      // Upper body — primary shoe color, glows slightly
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.48, 2.1),
        new THREE.MeshStandardMaterial({
          color: shoe3D,
          metalness: 0.15,
          roughness: 0.45,
          emissive: shoe3D,
          emissiveIntensity: 0.25,  // Self-illuminating so it's always visible
        })
      );
      upper.position.set(x, 0.69, -0.05);
      upper.castShadow = true;
      scene.add(upper);

      // Toe cap
      const toe = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.26, 0.55),
        new THREE.MeshStandardMaterial({
          color: shoe3D,
          metalness: 0.15,
          roughness: 0.45,
          emissive: shoe3D,
          emissiveIntensity: 0.2,
        })
      );
      toe.position.set(x, 0.52, 1.0);
      toe.rotation.x = -0.28;
      toe.castShadow = true;
      scene.add(toe);

      // Heel counter
      const heel = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.62, 0.5),
        new THREE.MeshStandardMaterial({
          color: shoe3D.clone().lerp(new THREE.Color(0x000000), 0.12),
          metalness: 0.1,
          roughness: 0.5,
          emissive: shoe3D.clone().lerp(new THREE.Color(0x000000), 0.12),
          emissiveIntensity: 0.2,
        })
      );
      heel.position.set(x, 0.62, -1.1);
      heel.castShadow = true;
      scene.add(heel);

      // Tongue (small upright piece)
      const tongue = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.35, 0.12),
        new THREE.MeshStandardMaterial({
          color: shoe3D,
          emissive: shoe3D,
          emissiveIntensity: 0.3,
          roughness: 0.6,
        })
      );
      tongue.position.set(x, 0.88, 0.75);
      scene.add(tongue);

      // Colored accent spotlight directly over this shoe
      const overSpot = new THREE.SpotLight(0xffffff, 4, 12, Math.PI / 8, 0.4, 1);
      overSpot.position.set(x, 6, 2);
      overSpot.target.position.set(x, 0, 0);
      scene.add(overSpot);
      scene.add(overSpot.target);

      // Accent color glow from below
      const accentGlow = new THREE.PointLight(accent3D, 3, 4);
      accentGlow.position.set(x, 0.2, 0);
      scene.add(accentGlow);

      // Register upper for click detection
      shoeMap.set(upper.uuid, id);
      clickableMeshes.current.push(upper);

      return upper;
    };

    // ── Input ────────────────────────────────────────────────────

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

    // ── Resize ───────────────────────────────────────────────────

    const onResize = () => {
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Render loop ──────────────────────────────────────────────

    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      // Slow sweep of main spot
      mainSpot.position.x = Math.sin(t * 0.3) * 3;
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
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        cursor: 'pointer',
      }}
    />
  );
}
