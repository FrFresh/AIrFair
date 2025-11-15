import { useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

type Props = {
  /** Path to mp4/webm (1080p H.264 recommended) */
  src: string;
  /** Width/height in meters of the scrim plane */
  size?: { w: number; h: number };
  /** Initial opacity (0–1). Default 0 (we'll fade in). */
  opacity?: number;
  /** Position in world space */
  position?: [number, number, number];
  /** Optional HTML title/subtitle overlay */
  title?: string;
  subtitle?: string;
  /** Autoplay on mount */
  auto?: boolean;
  /** Scene to add to */
  scene: THREE.Scene;
};

export interface ProjectionScrimHandle {
  fadeIn: () => Promise<void>;
  fadeOut: () => Promise<void>;
}

/**
 * ProjectionScrim — a translucent "curtain" with a video projected on it.
 * - Subtle flutter via vertex displacement
 * - VideoTexture pipeline (muted, looped)
 * - fadeIn/fadeOut methods exposed via ref (returning Promises)
 */
const ProjectionScrim = forwardRef<ProjectionScrimHandle, Props>((props, ref) => {
  const {
    src,
    size = { w: 6, h: 4 },
    opacity = 0,
    position = [0, 2, 0],
    title,
    subtitle,
    auto = false,
    scene,
  } = props;

  const groupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const videoRef = useRef<HTMLVideoElement>();
  const texRef = useRef<THREE.VideoTexture>();
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>(performance.now());
  const overlayRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    fadeIn: () => {
      return new Promise<void>((resolve) => {
        if (matRef.current) {
          gsap.to(matRef.current.uniforms.uOpacity, {
            value: 1,
            duration: 1.2,
            ease: "power2.out",
            onComplete: resolve,
          });
        }
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out",
          });
        }
      });
    },
    fadeOut: () => {
      return new Promise<void>((resolve) => {
        if (matRef.current) {
          gsap.to(matRef.current.uniforms.uOpacity, {
            value: 0,
            duration: 0.8,
            ease: "power2.in",
            onComplete: resolve,
          });
        }
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power2.in",
          });
        }
      });
    },
  }));

  // ---------- Video setup
  useEffect(() => {
    const v = document.createElement("video");
    v.src = src;
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    
    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        // will play after first user interaction
      }
    };
    tryPlay();
    videoRef.current = v;

    const t = new THREE.VideoTexture(v);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.format = THREE.RGBAFormat;
    texRef.current = t;

    return () => {
      t.dispose();
      v.pause();
      v.src = "";
      videoRef.current = undefined;
    };
  }, [src]);

  // ---------- Geometry / Material
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(size.w, size.h, 80, 80);
  }, [size.w, size.h]);

  const material = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uVideo: { value: texRef.current ?? null as any },
    };

    const vertex = `
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float nx = sin((p.y*3.0) + uTime*0.6)*0.02;
        float ny = sin((p.x*2.0) + uTime*0.4)*0.01;
        p.z += nx + ny;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `;

    const fragment = `
      uniform sampler2D uVideo;
      uniform float uOpacity;
      varying vec2 vUv;
      void main(){
        float vignette = smoothstep(0.95, 0.55, length(vUv - 0.5));
        vec4 vid = texture2D(uVideo, vUv);
        vec3 color = mix(vec3(0.0), vid.rgb, vignette);
        gl_FragColor = vec4(color, uOpacity);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });

    matRef.current = mat;
    return mat;
  }, [opacity]);

  // ---------- Add to scene
  useEffect(() => {
    if (!scene) return;

    const group = new THREE.Group();
    group.position.set(...position);

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    groupRef.current = group;
    meshRef.current = mesh;
    scene.add(group);

    return () => {
      if (scene && groupRef.current) {
        scene.remove(groupRef.current);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [scene, geometry, material, position]);

  // ---------- Update video texture when ready
  useEffect(() => {
    if (texRef.current && matRef.current) {
      matRef.current.uniforms.uVideo.value = texRef.current;
      matRef.current.needsUpdate = true;
    }
  }, [texRef.current]);

  // ---------- Animate time uniform
  useEffect(() => {
    const tick = () => {
      const t = (performance.now() - startTimeRef.current) / 1000;
      if (matRef.current) matRef.current.uniforms.uTime.value = t;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  // ---------- Auto fade-in
  useEffect(() => {
    if (!auto || !matRef.current) return;
    gsap.to(matRef.current.uniforms.uOpacity, { value: 1, duration: 1.2, ease: "power2.out", delay: 0.2 });
  }, [auto]);

  return (
    <>
      {(title || subtitle) && (
        <div
          ref={overlayRef}
          className="projectionOverlay"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0,
          }}
        >
          {title && (
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '0 0 20px rgba(214, 31, 41, 0.5)',
              marginBottom: '0.5rem',
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{
              fontSize: '1.2rem',
              color: '#ddd',
              textShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </>
  );
});

ProjectionScrim.displayName = 'ProjectionScrim';

export default ProjectionScrim;
