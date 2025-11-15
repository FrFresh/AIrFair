import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { VideoTexture } from 'three';
import gsap from 'gsap';
import { moveCameraTo } from '../lib/camera';

export interface RevealPanelsProps {
  videoSrc: string;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  currentId: 'aj1' | 'aj3' | 'aj12';
}

export interface RevealPanelsHandle {
  open: () => Promise<void>;
}

const RevealPanels = forwardRef<RevealPanelsHandle, RevealPanelsProps>(({
  videoSrc,
  scene,
  camera,
  currentId,
}, ref) => {
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<VideoTexture | null>(null);

  useImperativeHandle(ref, () => ({
    open: async () => {
      // Start with panels at initial positions with low opacity
      meshesRef.current.forEach((mesh, i) => {
        gsap.set(mesh.position, { 
          x: [-1.3, 0, 1.3][i] 
        });
        gsap.set(meshesRef.current[i].material, { 
          opacity: 0.7 
        });
      });

      // Animate to open positions
      const tl = gsap.timeline();
      
      meshesRef.current.forEach((mesh, i) => {
        const targetX = [-2.2, 0, 2.2][i];
        tl.to(mesh.position, {
          x: targetX,
          duration: 1.5,
          ease: 'power2.inOut',
        }, 0);
      });

      meshesRef.current.forEach((mesh) => {
        tl.to((mesh.material as THREE.MeshStandardMaterial), {
          opacity: 1,
          duration: 1.0,
          ease: 'power2.inOut',
        }, 0);
      });

      await tl;

      // Move camera after panels open
      moveCameraTo(camera, currentId);
    },
  }));

  // Sync video time across all panels
  const sync = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    // Ensure all video textures stay in sync
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    if (!scene) return;

    // Create video
    const video = document.createElement('video');
    video.src = videoSrc;
    video.loop = true;
    video.muted = true;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    videoRef.current = video;

    const handleLoadedData = () => {
      video.play().catch(err => console.warn('Video play failed:', err));
      
      const texture = new VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      textureRef.current = texture;

      // Create three panels
      const positions = [-1.3, 0, 1.3];
      meshesRef.current = [];
      materialsRef.current = [];

      positions.forEach((x, i) => {
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });

        const geometry = new THREE.PlaneGeometry(2.5, 4);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 2, -2);
        mesh.rotation.y = Math.PI; // Face camera
        
        scene.add(mesh);
        meshesRef.current.push(mesh);
        materialsRef.current.push(material);
      });

      // Sync video time every frame
      const syncInterval = setInterval(sync, 1000 / 30);
      return () => clearInterval(syncInterval);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.pause();
      video.src = '';
      
      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      meshesRef.current = [];
      materialsRef.current = [];
    };
  }, [videoSrc, scene]);

  return null;
});

RevealPanels.displayName = 'RevealPanels';

export default RevealPanels;




