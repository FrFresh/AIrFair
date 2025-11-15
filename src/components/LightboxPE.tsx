import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import gsap from 'gsap';

export type Annotation = {
  id: string;
  pos: [number, number, number];
  title: string;
  copy: string;
};

interface LightboxPEProps {
  modelPath?: string;
  annotations?: Annotation[];
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export default function LightboxPE({
  modelPath,
  annotations = [],
  scene,
  camera,
  renderer,
}: LightboxPEProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const css2DRendererRef = useRef<CSS2DRenderer>();
  const modelRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Mesh | null>(null);
  const labelLayerRef = useRef<THREE.Scene>();
  const animationRef = useRef<number>();
  const isRotatingRef = useRef(true);
  const rotationSpeedRef = useRef(0.005);
  const hotspotLabelsRef = useRef<CSS2DObject[]>([]);

  // Create lightbox room
  useEffect(() => {
    if (!scene) return;

    // White box room (walls only, no floor)
    const boxSize = 8;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(boxSize, boxSize),
      wallMaterial.clone()
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boxSize, boxSize),
      wallMaterial.clone()
    );
    backWall.position.z = -boxSize / 2;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boxSize, boxSize),
      wallMaterial.clone()
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -boxSize / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(boxSize, boxSize),
      wallMaterial.clone()
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = boxSize / 2;
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(boxSize, boxSize),
      wallMaterial.clone()
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = boxSize / 2;
    scene.add(ceiling);

    return () => {
      [floor, backWall, leftWall, rightWall, ceiling].forEach((wall) => {
        scene.remove(wall);
        wall.geometry.dispose();
        if (Array.isArray(wall.material)) {
          wall.material.forEach((m) => m.dispose());
        } else {
          wall.material.dispose();
        }
      });
    };
  }, [scene]);

  // Setup lights
  useEffect(() => {
    if (!scene) return;

    // Ambient light (very soft)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // RectAreaLight 1 (soft top-down)
    const rectLight1 = new THREE.RectAreaLight(0xffffff, 2, 6, 6);
    rectLight1.position.set(0, 3, 0);
    rectLight1.lookAt(0, 0, 0);
    scene.add(rectLight1);

    // RectAreaLight 2 (front fill)
    const rectLight2 = new THREE.RectAreaLight(0xffffff, 1, 8, 2);
    rectLight2.position.set(0, 1, 4);
    rectLight2.lookAt(0, 0, 0);
    scene.add(rectLight2);

    // Rim light (back edge)
    const rimLight = new THREE.SpotLight(0xffffff, 3, 10, Math.PI / 6, 0.5, 0.5);
    rimLight.position.set(0, 2, -3);
    rimLight.target.position.set(0, 0, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);

    return () => {
      scene.remove(ambient, rectLight1, rectLight2, rimLight, rimLight.target);
    };
  }, [scene]);

  // Load GLTF model
  useEffect(() => {
    if (!modelPath || !scene) return;

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        // Scale and position model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);
        
        // Center model
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y = -1.5;

        modelRef.current = model;
        scene.add(model);

        // Traverse and set materials
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      },
      (progress) => {
        console.log('Loading progress:', progress.total, '/', progress.loaded);
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }, [modelPath, scene]);

  // Create pedestal
  useEffect(() => {
    if (!scene) return;

    const pedestalGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.2, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.4,
      metalness: 0.1,
    });

    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.9;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    pedestalRef.current = pedestal;
    scene.add(pedestal);

    return () => {
      scene.remove(pedestal);
      pedestalGeo.dispose();
      pedestalMat.dispose();
    };
  }, [scene]);

  // Setup CSS2DRenderer for annotations
  useEffect(() => {
    if (!containerRef.current || !camera) return;

    const css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0';
    css2DRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(css2DRenderer.domElement);
    css2DRendererRef.current = css2DRenderer;

    return () => {
      if (css2DRendererRef.current && containerRef.current) {
        containerRef.current.removeChild(css2DRendererRef.current.domElement);
      }
    };
  }, [camera]);

  // Create annotation hotspots
  useEffect(() => {
    if (!scene || !annotations.length || !css2DRendererRef.current) return;

    hotspotLabelsRef.current.forEach((label) => {
      scene.remove(label);
    });
    hotspotLabelsRef.current = [];

    annotations.forEach((annotation) => {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'annotation-hotspot';
      labelDiv.style.cssText = `
        background: rgba(214, 31, 41, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        cursor: pointer;
        pointer-events: auto;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s;
      `;
      labelDiv.textContent = annotation.title;
      labelDiv.addEventListener('mouseenter', () => {
        labelDiv.style.transform = 'scale(1.1)';
      });
      labelDiv.addEventListener('mouseleave', () => {
        labelDiv.style.transform = 'scale(1)';
      });

      const label = new CSS2DObject(labelDiv);
      label.position.set(...annotation.pos);
      scene.add(label);
      hotspotLabelsRef.current.push(label);
    });

    return () => {
      hotspotLabelsRef.current.forEach((label) => {
        scene.remove(label);
      });
    };
  }, [annotations, scene]);

  // Rotation animation
  useEffect(() => {
    if (!modelRef.current) return;

    const animate = () => {
      if (modelRef.current && isRotatingRef.current) {
        modelRef.current.rotation.y += rotationSpeedRef.current;
      }
      if (css2DRendererRef.current && camera) {
        css2DRendererRef.current.render(scene, camera);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scene, camera]);

  // Pointer down handler (pause rotation)
  useEffect(() => {
    const handlePointerDown = () => {
      isRotatingRef.current = false;
    };

    const handlePointerUp = () => {
      isRotatingRef.current = true;
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('pointerdown', handlePointerDown);
      containerRef.current.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('pointerdown', handlePointerDown);
        containerRef.current.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, []);

  return null; // This component manages 3D scene, no JSX to render
}

// Camera focus function for annotations
export function focus(id: string, annotations: Annotation[], camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
  const annotation = annotations.find(a => a.id === id);
  if (!annotation) return;

  // Calculate camera position offset from annotation
  const offset = new THREE.Vector3(0, 0.5, 2); // Small offset back and up
  const targetPos = new THREE.Vector3(...annotation.pos);
  const cameraPos = targetPos.clone().add(offset);

  // Animate camera to focus position
  gsap.to(camera.position, {
    x: cameraPos.x,
    y: cameraPos.y,
    z: cameraPos.z,
    duration: 1.2,
    ease: 'power2.inOut',
  });

  // Look at annotation position
  gsap.to({ t: 0 }, {
    t: 1,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: function() {
      const lookAt = targetPos.clone();
      camera.lookAt(lookAt);
    },
  });
}

