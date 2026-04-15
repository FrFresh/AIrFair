import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type SneakerOpts = {
  displayNumber?: string;
  year?: number;
  shoeImage?: string;
  modelPath?: string;
};

type PlacardEntry = {
  mat: THREE.MeshBasicMaterial;
  defaultTex: THREE.CanvasTexture;
};

type Props = {
  onReady?: (api: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    addSneaker: (x: number, pedestalColor?: string, shoeColor?: string, accentColor?: string, opts?: SneakerOpts) => THREE.Object3D;
    updatePlacard: (shoeId: string, imageUrl?: string) => void;
  }) => void;
  onSelect?: (id: string) => void;
};

// Maps shoe mesh uuid → silhouette id for click detection
const shoeMap = new Map<string, string>();
const SHOE_IDS = ['aj1', 'aj3', 'aj12'];

/**
 * Editorial default placard — shown when no player photo is selected.
 * Serif italic typography, minimal, gallery-grade.
 */
function makeDisplayTexture(number: string, year: number, accent: string): THREE.CanvasTexture {
  const W = 600, H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Very dark background with subtle vignette
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, W, H);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.75);
  vignette.addColorStop(0, 'rgba(30,30,30,0.0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Thin accent top bar
  ctx.fillStyle = accent;
  ctx.fillRect(48, 52, W - 96, 2);

  // "JORDAN BRAND" — small caps tracking
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '500 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('J O R D A N   B R A N D', W / 2, 94);

  // Large italic model number — the hero element
  const numSize = number.length > 1 ? 210 : 260;
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic bold ${numSize}px Georgia, "Times New Roman", serif`;
  ctx.fillText(number, W / 2, 420);

  // Subtle number shadow/glow behind it
  ctx.globalAlpha = 0.08;
  ctx.font = `italic bold ${numSize + 40}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = accent;
  ctx.fillText(number, W / 2, 426);
  ctx.globalAlpha = 1;

  // Year — spaced, muted
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '300 22px Georgia, serif';
  ctx.fillText(String(year), W / 2, 490);

  // Thin accent center divider
  ctx.strokeStyle = accent + '60';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, 518); ctx.lineTo(W / 2 + 40, 518);
  ctx.stroke();

  // "Player Exclusive" — italic, elegant
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('Player Exclusive', W / 2, 556);

  // Thin accent bottom bar
  ctx.fillStyle = accent;
  ctx.fillRect(48, H - 54, W - 96, 2);

  return new THREE.CanvasTexture(canvas);
}


/**
 * Load a shoe product shot, remove the white background, return as texture.
 * Uses a brightness + saturation threshold to strip studio white BGs
 * while preserving white leather parts of the shoe (which have texture/shadow).
 */
function loadShoeTexture(
  url: string,
  onLoad: (tex: THREE.CanvasTexture, aspect: number) => void
) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, W, H);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const brightness  = (r + g + b) / 3;
      const saturation  = Math.max(r, g, b) - Math.min(r, g, b);

      // Pure background: very bright AND nearly unsaturated
      if (brightness > 245 && saturation < 12) {
        d[i + 3] = 0;
      // Soft anti-alias fringe
      } else if (brightness > 232 && saturation < 20) {
        const t = (brightness - 232) / 13; // 0→1 as brightness 232→245
        d[i + 3] = Math.round((1 - t) * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    onLoad(new THREE.CanvasTexture(canvas), W / H);
  };
  img.src = url;
}

/**
 * Load a player photo as a cinematic B&W texture with vignette.
 * Uses pixel-level grayscale (no ctx.filter) for broad compatibility,
 * then overlays a radial vignette and bottom fade.
 */
function loadCinematicTexture(
  url: string,
  onLoad: (tex: THREE.CanvasTexture) => void,
  onError: () => void
) {
  const loader = new THREE.TextureLoader();
  loader.load(url, (srcTex) => {
    const img = srcTex.image as HTMLImageElement;
    const W = img.naturalWidth  || img.width;
    const H = img.naturalHeight || img.height;
    if (!W || !H) { onError(); return; }

    const scale = Math.min(1, 1024 / Math.max(W, H));
    const cw = Math.round(W * scale);
    const ch = Math.round(H * scale);

    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d')!;

    // Draw full-color first
    ctx.drawImage(img, 0, 0, cw, ch);
    srcTex.dispose();

    // Manual grayscale + slight contrast + brightness reduction
    const id = ctx.getImageData(0, 0, cw, ch);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      // Luminance-weighted grayscale
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast 1.12, brightness 0.82
      const val = Math.min(255, Math.max(0, (lum - 128) * 1.12 + 128 * 0.82));
      d[i] = d[i + 1] = d[i + 2] = val;
    }
    ctx.putImageData(id, 0, 0);

    // Radial vignette
    const vx = cw / 2, vy = ch / 2;
    const vig = ctx.createRadialGradient(
      vx, vy, Math.min(cw, ch) * 0.28,
      vx, vy, Math.max(cw, ch) * 0.72
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, cw, ch);

    // Bottom fade so shoe reads cleanly in front
    const fade = ctx.createLinearGradient(0, ch * 0.6, 0, ch);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, cw, ch);

    onLoad(new THREE.CanvasTexture(canvas));
  }, undefined, onError);
}

export default function ThreeMuseum({ onReady, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const clickableMeshes = useRef<THREE.Mesh[]>([]);

  // ── Callback refs ─────────────────────────────────────────────────────────
  const onReadyRef  = useRef(onReady);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onReadyRef.current  = onReady;  }, [onReady]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current!;

    // Use window dimensions as a reliable fallback if element reports 0
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    scene.fog = new THREE.Fog(0x0d0d0d, 26, 42);

    // Camera — starts at gallery entrance looking at the shoes
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 1.8, 7);
    camera.lookAt(0, 1.4, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ── Environment map — makes PBR materials show correct color ──
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // ── Gallery environment ──────────────────────────────────────

    // Floor — gallery only
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.35, roughness: 0.7 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Gallery back wall
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

    // ── Placard registry — keyed by shoe id ──────────────────────
    const placardRegistry = new Map<string, PlacardEntry>();

    let shoeIndex = 0;

    const addSneaker = (
      x: number,
      pedestalColor = '#2a2a2a',
      shoeColor = '#eeeeee',
      accentColor = '#ffffff',
      opts: SneakerOpts = {}
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

      // ── Shoe display ─────────────────────────────────────────────
      // Priority: GLB model → flat image → box geometry fallback.
      // A pivot Group is returned immediately so the animation loop
      // in App.tsx can start rotating before the async load completes.

      // Invisible hitbox used for raycasting — sized to approximate
      // shoe footprint so clicking anywhere near the shoe triggers nav.
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.8, 2.8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      hitbox.position.set(x, 1.1, 0);
      scene.add(hitbox);
      shoeMap.set(hitbox.uuid, id);
      clickableMeshes.current.push(hitbox);

      // Pivot: rotation/float animation targets this; shoe sits inside it
      const pivot = new THREE.Group();
      pivot.position.set(x, 0, 0);
      scene.add(pivot);

      if (opts.modelPath) {
        const loader = new GLTFLoader();
        loader.load(opts.modelPath, (gltf) => {
          const model = gltf.scene;

          // Derive base URL for resolving relative texture paths
          const modelDir = opts.modelPath!.substring(0, opts.modelPath!.lastIndexOf('/'));
          const texLoader = new THREE.TextureLoader();
          const texCache = new Map<string, THREE.Texture>();

          model.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // If the material has no color map (happens when GLTF used an
            // unsupported extension), load the first listed image explicitly.
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const mat = m as THREE.MeshStandardMaterial;
              if (!mat || mat.map) return;
              const imgDefs = gltf.parser.json.images as Array<{ uri?: string }> | undefined;
              const uri = imgDefs?.[0]?.uri;
              if (!uri) return;
              const texUrl = `${modelDir}/${uri}`;
              if (!texCache.has(texUrl)) {
                const tex = texLoader.load(texUrl);
                tex.flipY = false; // GLTF textures never flip Y
                tex.colorSpace = THREE.SRGBColorSpace;
                texCache.set(texUrl, tex);
              }
              mat.map = texCache.get(texUrl)!;
              mat.needsUpdate = true;
            });
          });

          // Scale so longest horizontal dimension = 2 world units
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxH = Math.max(size.x, size.z);
          const scale = 2.0 / maxH;
          model.scale.setScalar(scale);

          // Center horizontally, sit bottom of shoe on pedestal top (y=0.22)
          box.setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.x = -center.x;
          model.position.z = -center.z;
          model.position.y = -box.min.y + 0.22;

          pivot.add(model);
        });
      } else if (opts.shoeImage) {
        // Flat image plane fallback
        const planeMat = new THREE.MeshBasicMaterial({
          transparent: true, side: THREE.DoubleSide, depthWrite: false,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), planeMat);
        plane.position.set(0, 0.22 + 0.8, 0.05);
        pivot.add(plane);

        loadShoeTexture(opts.shoeImage, (tex, aspect) => {
          const pw = 2.4, ph = pw / aspect;
          plane.geometry.dispose();
          plane.geometry = new THREE.PlaneGeometry(pw, ph);
          plane.position.y = 0.22 + ph / 2;
          planeMat.map = tex;
          planeMat.needsUpdate = true;
        });
      } else {
        // Box geometry last resort
        const upper = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.48, 2.1),
          new THREE.MeshStandardMaterial({
            color: shoe3D, metalness: 0.15, roughness: 0.45,
            emissive: shoe3D, emissiveIntensity: 0.25,
          })
        );
        upper.position.set(0, 0.69, -0.05);
        upper.castShadow = true;
        pivot.add(upper);
      }

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

      // ── Museum display panel — large cinematic backdrop ──────
      // Tall portrait panel, shoe pedestal sits in front of it.
      // Inspired by gallery lightbox installs: the player photo fills
      // the full frame; bottom fades to black so the shoe reads clearly.
      const placardW = 2.6;
      const placardH = 4.8;
      const placardCY = placardH / 2 + 0.05; // bottom near floor
      const placardZ  = -1.55;

      // Thin dark frame — barely visible, like gallery framing
      const frameThick = 0.045;
      const frameMat = new THREE.MeshStandardMaterial({
        color:             new THREE.Color(0x111111),
        emissive:          new THREE.Color(accentColor),
        emissiveIntensity: 0.12,
        roughness:         0.95,
      });

      const addFrameBar = (w: number, h: number, fx: number, fy: number) => {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, h), frameMat);
        bar.position.set(fx, fy, placardZ - 0.005);
        scene.add(bar);
      };
      addFrameBar(placardW + frameThick * 2, frameThick, x, placardCY + placardH / 2 + frameThick / 2);
      addFrameBar(placardW + frameThick * 2, frameThick, x, placardCY - placardH / 2 - frameThick / 2);
      addFrameBar(frameThick, placardH, x - placardW / 2 - frameThick / 2, placardCY);
      addFrameBar(frameThick, placardH, x + placardW / 2 + frameThick / 2, placardCY);

      // Default canvas texture — shown when no player is selected
      const defaultTex = makeDisplayTexture(
        opts.displayNumber ?? '', opts.year ?? 0, accentColor
      );

      const contentMat = new THREE.MeshBasicMaterial({ map: defaultTex, transparent: true });

      const placard = new THREE.Mesh(
        new THREE.PlaneGeometry(placardW, placardH),
        contentMat
      );
      placard.position.set(x, placardCY, placardZ);
      scene.add(placard);

      // Register so updatePlacard can swap textures later
      placardRegistry.set(id, { mat: contentMat, defaultTex });

      return pivot;
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
        if (id && onSelectRef.current) onSelectRef.current(id);
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

    const updatePlacard = (shoeId: string, imageUrl?: string) => {
      const entry = placardRegistry.get(shoeId);
      if (!entry) return;
      const { mat, defaultTex } = entry;

      // Dispose any previously loaded player photo (not the default canvas tex)
      if (mat.map && mat.map !== defaultTex) {
        mat.map.dispose();
      }

      if (imageUrl) {
        // Show default while the cinematic version processes
        mat.map = defaultTex;
        mat.needsUpdate = true;
        loadCinematicTexture(
          imageUrl,
          (tex) => { mat.map = tex; mat.needsUpdate = true; },
          ()    => { mat.map = defaultTex; mat.needsUpdate = true; }
        );
      } else {
        mat.map = defaultTex;
        mat.needsUpdate = true;
      }
    };

    onReadyRef.current?.({ scene, camera, renderer, addSneaker, updatePlacard });

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Scene is built ONCE. Callbacks are accessed via refs above, not deps.

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
