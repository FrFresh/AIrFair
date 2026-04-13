import { useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

type Props = {
  /** Path to mp4/webm. If empty or missing, fallbackColor is displayed instead. */
  src?: string;
  /** Hex color shown when src is absent or video fails to load. */
  fallbackColor?: string;
  /** Width/height in world-space meters. */
  size?: { w: number; h: number };
  /** World-space opacity on mount. Default 0 (fade in via fadeIn() or auto). */
  opacity?: number;
  /** World-space position of the scrim plane. */
  position?: [number, number, number];
  /** Optional HTML title/subtitle overlay. */
  title?: string;
  subtitle?: string;
  /** Auto fade-in on mount. */
  auto?: boolean;
  /** Scene to inject the plane into. */
  scene: THREE.Scene;
};

export interface ProjectionScrimHandle {
  fadeIn:  () => Promise<void>;
  fadeOut: () => Promise<void>;
}

/**
 * ProjectionScrim
 * - Adds a translucent animated plane to an existing Three.js scene.
 * - Shows a VideoTexture when `src` loads, or `fallbackColor` if no video.
 * - fadeIn / fadeOut exposed via ref (return Promises).
 * - Flutter vertex displacement for organic feel.
 */
const ProjectionScrim = forwardRef<ProjectionScrimHandle, Props>((props, ref) => {
  const {
    src          = '',
    fallbackColor = '#888888',
    size         = { w: 6, h: 4 },
    opacity      = 0,
    position     = [0, 2, 0],
    title,
    subtitle,
    auto         = false,
    scene,
  } = props;

  const groupRef      = useRef<THREE.Group | null>(null);
  const meshRef       = useRef<THREE.Mesh | null>(null);
  const matRef        = useRef<THREE.ShaderMaterial | null>(null);
  const videoRef      = useRef<HTMLVideoElement | undefined>(undefined);
  const texRef        = useRef<THREE.VideoTexture | undefined>(undefined);
  const rafRef        = useRef<number | undefined>(undefined);
  const startTimeRef  = useRef<number>(performance.now());
  const overlayRef    = useRef<HTMLDivElement>(null);

  // ── Imperative handles ──────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    fadeIn: () => new Promise<void>((resolve) => {
      if (matRef.current)
        gsap.to(matRef.current.uniforms.uOpacity, { value: 1, duration: 1.2, ease: "power2.out", onComplete: resolve });
      if (overlayRef.current)
        gsap.to(overlayRef.current, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
    }),
    fadeOut: () => new Promise<void>((resolve) => {
      if (matRef.current)
        gsap.to(matRef.current.uniforms.uOpacity, { value: 0, duration: 0.8, ease: "power2.in", onComplete: resolve });
      if (overlayRef.current)
        gsap.to(overlayRef.current, { opacity: 0, y: 20, duration: 0.8, ease: "power2.in" });
    }),
  }));

  // ── Video setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!src) {
      // No video path supplied — fragment shader will use fallbackColor.
      return;
    }

    const v = document.createElement("video");
    v.src        = src;
    v.crossOrigin = "anonymous";
    v.muted      = true;
    v.loop       = true;
    v.playsInline = true;

    const tryPlay = async () => {
      try {
        await v.play();
        // Video is playing — tell the shader to sample it
        if (matRef.current) matRef.current.uniforms.uUseVideo.value = 1.0;
      } catch {
        // Autoplay blocked or file missing — fallback color stays visible
      }
    };
    tryPlay();
    videoRef.current = v;

    const t = new THREE.VideoTexture(v);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.format    = THREE.RGBAFormat;
    texRef.current = t;

    return () => {
      t.dispose();
      v.pause();
      v.src         = "";
      videoRef.current = undefined;
      texRef.current   = undefined;
    };
  }, [src]);

  // ── Geometry ─────────────────────────────────────────────────────────────

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(size.w, size.h, 80, 80),
    [size.w, size.h]
  );

  // ── Shader material ───────────────────────────────────────────────────────

  const material = useMemo(() => {
    const fallback3 = new THREE.Color(fallbackColor);

    const uniforms = {
      uTime:          { value: 0 },
      uOpacity:       { value: opacity },
      uVideo:         { value: texRef.current ?? null as unknown as THREE.VideoTexture },
      uFallbackColor: { value: fallback3 },
      uUseVideo:      { value: 0.0 }, // 0 = show fallback, 1 = show video
    };

    const vertexShader = /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float nx = sin(p.y * 3.0 + uTime * 0.6) * 0.02;
        float ny = sin(p.x * 2.0 + uTime * 0.4) * 0.01;
        p.z += nx + ny;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform sampler2D uVideo;
      uniform float uOpacity;
      uniform vec3  uFallbackColor;
      uniform float uUseVideo;
      varying vec2  vUv;

      void main(){
        float vignette = smoothstep(0.9, 0.4, length(vUv - 0.5));

        // Video or fallback color
        vec4  vid      = texture2D(uVideo, vUv);
        vec3  fallback = uFallbackColor * (0.5 + 0.5 * vignette);
        vec3  srcColor = mix(fallback, vid.rgb, uUseVideo);
        vec3  color    = mix(vec3(0.0), srcColor, vignette);

        gl_FragColor = vec4(color, uOpacity * vignette);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite:  false,
    });

    matRef.current = mat;
    return mat;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opacity, fallbackColor]);

  // ── Inject into scene ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!scene) return;

    const group = new THREE.Group();
    group.position.set(...position);

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    groupRef.current = group;
    meshRef.current  = mesh;
    scene.add(group);

    return () => {
      if (groupRef.current) scene.remove(groupRef.current);
      geometry.dispose();
      material.dispose();
    };
  // position is a tuple — stable if caller doesn't recreate it every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, geometry, material]);

  // ── Sync VideoTexture uniform once video is ready ─────────────────────────

  useEffect(() => {
    if (texRef.current && matRef.current) {
      matRef.current.uniforms.uVideo.value = texRef.current;
      matRef.current.needsUpdate = true;
    }
  });

  // ── Animate time uniform ──────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      const t = (performance.now() - startTimeRef.current) / 1000;
      if (matRef.current) matRef.current.uniforms.uTime.value = t;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Auto fade-in ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!auto || !matRef.current) return;
    gsap.to(matRef.current.uniforms.uOpacity, {
      value: 1,
      duration: 1.4,
      ease: "power2.out",
      delay: 0.3,
    });
  }, [auto]);

  // ── HTML title/subtitle overlay ────────────────────────────────────────────

  return (
    <>
      {(title || subtitle) && (
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 50,
            opacity: 0,
          }}
        >
          {title && (
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#fff",
              textShadow: "0 0 20px rgba(214,31,41,0.5)", marginBottom: "0.5rem" }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontSize: "1.2rem", color: "#ddd",
              textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </>
  );
});

ProjectionScrim.displayName = "ProjectionScrim";
export default ProjectionScrim;
