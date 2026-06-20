import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type SneakerOpts = {
  displayNumber?: string;
  year?: number;
  shoeImage?: string;
  modelPath?: string;
  /** Model file contains only a single shoe — mirror it into a left+right pair. */
  mirrorToPair?: boolean;
  /** Model file ships as a pair — keep just one shoe for a single-shoe display. */
  singleFromPair?: boolean;
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
  onSwipe?: (direction: 'left' | 'right') => void;
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

/**
 * Procedural dark hardwood floor — long straight espresso planks running
 * front-to-back, with vertical grain, staggered butt joints and beveled
 * seam shadows. Matches the satin walnut floor of a gallery hall.
 */
function makeWoodFloorTexture(): THREE.CanvasTexture {
  const W = 512, H = 1024;   // tall so planks read long
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1009';
  ctx.fillRect(0, 0, W, H);

  const planks = 6;
  const pw = W / planks;
  const shades = ['#3a2417', '#2e1b10', '#43291a', '#34200f', '#3f2616', '#2a190d'];

  for (let i = 0; i < planks; i++) {
    const x = i * pw;
    ctx.fillStyle = shades[i % shades.length];
    ctx.fillRect(x, 0, pw, H);

    // dark vertical grain streaks
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    for (let g = 4; g < pw; g += 7) {
      const gx = x + g;
      ctx.beginPath();
      ctx.moveTo(gx + Math.sin(g) * 1.5, 0);
      ctx.lineTo(gx - Math.sin(g) * 1.5, H);
      ctx.stroke();
    }
    // faint warm grain highlights
    ctx.strokeStyle = 'rgba(255,210,160,0.05)';
    for (let g = 8; g < pw; g += 13) {
      ctx.beginPath();
      ctx.moveTo(x + g, 0);
      ctx.lineTo(x + g, H);
      ctx.stroke();
    }
    // staggered butt joint across this plank
    const jointY = (i * 311) % H;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, jointY); ctx.lineTo(x + pw, jointY); ctx.stroke();

    // plank seam — shadow on left edge, faint highlight on right
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,170,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 1.5, 0); ctx.lineTo(x + 1.5, H); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural matte plaster — warm greige gallery wall paint with very
 * subtle large-scale mottling so it isn't a dead flat color.
 */
function makePlasterTexture(): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4cabb';      // warm greige
  ctx.fillRect(0, 0, S, S);

  // gentle mottling — alternating light/dark soft blotches
  for (let i = 0; i < 150; i++) {
    const x = (i * 97) % S;
    const y = (i * 53) % S;
    const r = 20 + (i % 40);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = i % 2 === 0 ? '120,108,92' : '255,250,240';
    g.addColorStop(0, `rgba(${tone},0.018)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function ThreeMuseum({ onReady, onSelect, onSwipe }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const clickableMeshes = useRef<THREE.Mesh[]>([]);

  // ── Callback refs ─────────────────────────────────────────────────────────
  const onReadyRef  = useRef(onReady);
  const onSelectRef = useRef(onSelect);
  const onSwipeRef  = useRef(onSwipe);
  useEffect(() => { onReadyRef.current  = onReady;  }, [onReady]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { onSwipeRef.current  = onSwipe;  }, [onSwipe]);

  useEffect(() => {
    const container = containerRef.current!;

    // Use window dimensions as a reliable fallback if element reports 0
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f0a);
    scene.fog = new THREE.Fog(0x140f0a, 24, 50);

    // Camera — wide establishing view of the vast open hall
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 120);
    camera.position.set(0, 3.8, 17);
    camera.lookAt(0, 3.4, -3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── Environment map — makes PBR materials show correct color ──
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // ── Gallery environment — vast open exhibition hall ──────────
    // Side walls pushed far out so the exhibits have air around them;
    // the portraits hang from the ceiling rather than sit on a wall.
    const ROOM_X   = 20;         // side walls way out at x = ±20
    const WALL_H   = 11;         // tall gallery ceiling
    const BACK_Z   = -9;         // back wall pushed back for depth
    const FRONT_Z  = 18;         // walls run forward to here (past the camera)
    const WALL_D   = FRONT_Z - BACK_Z;
    const MID_Z    = BACK_Z + WALL_D / 2;
    const SHOE_X   = 8;          // pedestals sit at x = -SHOE_X, 0, +SHOE_X

    // Dark straight-plank hardwood floor (boards run front-to-back)
    const floorTex = makeWoodFloorTexture();
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(11, 7);
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, metalness: 0.1, roughness: 0.4 });
    // Floor matches the ceiling/wall footprint exactly so the box is aligned
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * ROOM_X, WALL_D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, MID_Z);
    floor.receiveShadow = true;
    scene.add(floor);

    // Matte plaster gallery walls — one source texture, cloned per wall
    const wallSrc = makePlasterTexture();
    const makeWallMat = (rx: number, ry: number) => {
      const t = wallSrc.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: t, metalness: 0.0, roughness: 0.96 });
    };

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(2 * ROOM_X, WALL_H), makeWallMat(7, 2));
    backWall.position.set(0, WALL_H / 2, BACK_Z);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_D, WALL_H), makeWallMat(7, 2));
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM_X, WALL_H / 2, MID_Z);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_D, WALL_H), makeWallMat(7, 2));
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM_X, WALL_H / 2, MID_Z);
    scene.add(rightWall);

    // Ceiling — warm greige plaster, a touch lighter so the runway reads
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * ROOM_X, WALL_D),
      new THREE.MeshStandardMaterial({ color: 0x3a352c, roughness: 0.95 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, WALL_H, MID_Z);
    scene.add(ceiling);

    // ── Trim & recessed lighting ─────────────────────────────────
    // White painted gallery trim (baseboard + crown)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, metalness: 0.0, roughness: 0.6 });
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xfff0d6, emissive: 0xffd9a0, emissiveIntensity: 2.2,
    });

    const addBox = (w: number, h: number, d: number, px: number, py: number, pz: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    };

    // Crown molding just below the ceiling
    const crownH = 0.28, crownY = WALL_H - crownH / 2;
    addBox(2 * ROOM_X, crownH, 0.18, 0, crownY, BACK_Z + 0.1, trimMat);
    addBox(0.18, crownH, WALL_D, -ROOM_X + 0.1, crownY, MID_Z, trimMat);
    addBox(0.18, crownH, WALL_D,  ROOM_X - 0.1, crownY, MID_Z, trimMat);

    // Baseboard at the floor
    const baseH = 0.35, baseY = baseH / 2;
    addBox(2 * ROOM_X, baseH, 0.16, 0, baseY, BACK_Z + 0.08, trimMat);
    addBox(0.16, baseH, WALL_D, -ROOM_X + 0.08, baseY, MID_Z, trimMat);
    addBox(0.16, baseH, WALL_D,  ROOM_X - 0.08, baseY, MID_Z, trimMat);

    // ── Central light runway — recessed glowing channel down the hall ──
    // Its converging lines pull the visitor's eye toward a bright focal
    // terminus at the far (back) wall.
    const RUN_LEN = WALL_D;

    // Recessed cove walls flanking the channel (dark, give it depth)
    const coveMat = new THREE.MeshStandardMaterial({ color: 0x1b1712, roughness: 1 });
    addBox(0.14, 0.5, RUN_LEN, -0.95, WALL_H - 0.25, MID_Z, coveMat);
    addBox(0.14, 0.5, RUN_LEN,  0.95, WALL_H - 0.25, MID_Z, coveMat);

    // Glowing light channel down the center
    addBox(1.5, 0.06, RUN_LEN, 0, WALL_H - 0.1, MID_Z, stripMat);

    // Real light from the runway — warm lamps brightening toward the focal end
    [13, 8, 3, -2, -7].forEach((rz, i) => {
      const lamp = new THREE.PointLight(0xffe6bc, 1.0 + i * 0.55, 24);
      lamp.position.set(0, WALL_H - 0.7, rz);
      scene.add(lamp);
    });

    // ── Lighting — warm gallery wash ─────────────────────────────
    scene.add(new THREE.AmbientLight(0xffe7cc, 0.55));
    scene.add(new THREE.HemisphereLight(0xffe2c0, 0x241810, 0.5));

    // Main overhead spot washing the central exhibits
    const mainSpot = new THREE.SpotLight(0xffe6c6, 11, 72, Math.PI / 3, 0.35, 1);
    mainSpot.position.set(0, 14, 7);
    mainSpot.target.position.set(0, 0, 0);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.set(2048, 2048);
    scene.add(mainSpot);
    scene.add(mainSpot.target);

    // Warm wall-wash fills out toward the distant side walls
    const fillL = new THREE.PointLight(0xffdcae, 2.8, 48);
    fillL.position.set(-16, 8, 5);
    scene.add(fillL);

    const fillR = new THREE.PointLight(0xffdcae, 2.8, 48);
    fillR.position.set(16, 8, 5);
    scene.add(fillR);

    // Soft ceiling ambience matching the recessed strips
    const ceilGlow = new THREE.PointLight(0xffe0b0, 1.8, 34);
    ceilGlow.position.set(0, 10.2, 2);
    scene.add(ceilGlow);

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

      // ── Plinth — raised matte block so the shoe sits at viewing height ──
      const PLINTH_H = 1.15;
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, PLINTH_H, 1.7),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(pedestalColor),
          metalness: 0.2,
          roughness: 0.6,
        })
      );
      ped.position.set(x, PLINTH_H / 2, 0);
      ped.receiveShadow = true;
      ped.castShadow = true;
      scene.add(ped);

      // Glowing accent ring inset on the plinth top
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
      ring.position.set(x, PLINTH_H + 0.005, 0);
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
      hitbox.position.set(x, PLINTH_H + 0.9, 0);
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

          if (opts.singleFromPair) {
            // Model ships as a pair (e.g. AJ1's two meshes) — drop one shoe so
            // every plinth shows a single hero shoe for continuity.
            const meshes: THREE.Mesh[] = [];
            model.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
            });
            if (meshes.length > 1) {
              const centers = meshes.map((m) =>
                new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3())
              );
              // Split along whichever horizontal axis separates the two shoes
              const spreadX = Math.max(...centers.map((c) => c.x)) - Math.min(...centers.map((c) => c.x));
              const spreadZ = Math.max(...centers.map((c) => c.z)) - Math.min(...centers.map((c) => c.z));
              const axis = spreadX >= spreadZ ? 'x' : 'z';
              const vals = centers.map((c) => c[axis]);
              const mid = (Math.min(...vals) + Math.max(...vals)) / 2;
              meshes.forEach((m, i) => {
                if (vals[i] < mid) m.removeFromParent();
              });
            }
          }

          if (opts.mirrorToPair) {
            // Model holds a single shoe — clone + mirror it into a pair so
            // it matches the multi-mesh models (e.g. AJ1) that ship as a pair.

            // Scale so each shoe's footprint ≈ 1.4 units (two fit on the plinth)
            let box = new THREE.Box3().setFromObject(model);
            let size = box.getSize(new THREE.Vector3());
            const scale = 1.4 / Math.max(size.x, size.z);
            model.scale.setScalar(scale);

            // Center the single shoe on its own origin so mirroring is clean
            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x -= center.x;
            model.position.y -= center.y;
            model.position.z -= center.z;

            // Mirrored twin (opposite foot). Clone materials so we can flip
            // their winding side without affecting the original.
            const twin = model.clone(true);
            twin.traverse((c) => {
              const mesh = c as THREE.Mesh;
              if (!mesh.isMesh) return;
              const wasArray = Array.isArray(mesh.material);
              const mats = wasArray ? (mesh.material as THREE.Material[]) : [mesh.material as THREE.Material];
              const cloned = mats.map((m) => {
                const mm = m.clone();
                (mm as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                return mm;
              });
              mesh.material = wasArray ? cloned : cloned[0];
            });
            twin.scale.x *= -1; // mirror across X → right foot from left

            // Sit the two shoes side by side with a small gap
            box.setFromObject(model);
            size = box.getSize(new THREE.Vector3());
            const dx = size.x / 2 + 0.1;
            model.position.x -= dx;
            twin.position.x += dx;

            const pair = new THREE.Group();
            pair.add(model);
            pair.add(twin);

            // Rest the pair on the plinth top
            const pairBox = new THREE.Box3().setFromObject(pair);
            pair.position.y = PLINTH_H - pairBox.min.y;
            pivot.add(pair);
          } else {
            // Scale so longest horizontal dimension = 2 world units
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxH = Math.max(size.x, size.z);
            const scale = 2.0 / maxH;
            model.scale.setScalar(scale);

            // Center horizontally, sit bottom of shoe on the plinth top
            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y + PLINTH_H;

            pivot.add(model);
          }
        });
      } else if (opts.shoeImage) {
        // Flat image plane fallback
        const planeMat = new THREE.MeshBasicMaterial({
          transparent: true, side: THREE.DoubleSide, depthWrite: false,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), planeMat);
        plane.position.set(0, PLINTH_H + 0.8, 0.05);
        pivot.add(plane);

        loadShoeTexture(opts.shoeImage, (tex, aspect) => {
          const pw = 2.4, ph = pw / aspect;
          plane.geometry.dispose();
          plane.geometry = new THREE.PlaneGeometry(pw, ph);
          plane.position.y = PLINTH_H + ph / 2;
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
        upper.position.set(0, PLINTH_H + 0.6, -0.05);
        upper.castShadow = true;
        pivot.add(upper);
      }

      // Colored accent spotlight directly over this shoe
      const overSpot = new THREE.SpotLight(0xffffff, 4, 12, Math.PI / 8, 0.4, 1);
      overSpot.position.set(x, 6, 2);
      overSpot.target.position.set(x, 0, 0);
      scene.add(overSpot);
      scene.add(overSpot.target);

      // Accent color glow rising off the plinth top
      const accentGlow = new THREE.PointLight(accent3D, 3, 4);
      accentGlow.position.set(x, PLINTH_H + 0.1, 0);
      scene.add(accentGlow);

      // ── Hanging banner — large portrait suspended from the ceiling ──
      // A fabric banner floats behind the shoe on two thin cables with a
      // top rod, so each exhibit has open air instead of a wall panel.
      const bannerW   = 4.0;                       // true 2:3 with the 600×900 texture
      const bannerH   = 6.0;
      const bannerZ   = -2.8;
      const bannerTop = 8.0;                       // lowered so it centers on the wall
      const bannerCY  = bannerTop - bannerH / 2;   // banner center

      // Default canvas texture — shown when no player is selected
      const defaultTex = makeDisplayTexture(
        opts.displayNumber ?? '', opts.year ?? 0, accentColor
      );

      const contentMat = new THREE.MeshBasicMaterial({
        map: defaultTex, transparent: true, side: THREE.DoubleSide,
      });

      const placard = new THREE.Mesh(
        new THREE.PlaneGeometry(bannerW, bannerH),
        contentMat
      );
      placard.position.set(x, bannerCY, bannerZ);
      scene.add(placard);

      // Suspension hardware — top dowel rod + two thin cables to the ceiling
      const rigMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.6, roughness: 0.4 });
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, bannerW + 0.3, 12), rigMat);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(x, bannerTop + 0.05, bannerZ);
      scene.add(rod);

      const cableLen = WALL_H - bannerTop;          // ceiling down to the rod
      [-1, 1].forEach((s) => {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, cableLen, 8),
          rigMat
        );
        cable.position.set(x + s * bannerW * 0.42, bannerTop + cableLen / 2, bannerZ);
        scene.add(cable);
      });

      // Soft warm spot so the banner art reads
      const bannerSpot = new THREE.SpotLight(0xffe6c6, 4, 20, Math.PI / 7, 0.4, 1);
      bannerSpot.position.set(x, 9.5, bannerZ + 3);
      bannerSpot.target.position.set(x, bannerCY, bannerZ);
      scene.add(bannerSpot);
      scene.add(bannerSpot.target);

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

    // ── Touch input ──────────────────────────────────────────────

    const ZOOM_MIN_T = 1.0;
    const ZOOM_MAX_T = 9.0;

    let touchStartX = 0;
    let touchStartY = 0;
    let lastPinchDist = 0;
    let touchMoved = false;

    const getPinchDist = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
      } else if (e.touches.length === 2) {
        lastPinchDist = getPinchDist(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // prevent browser zoom
        const dist = getPinchDist(e.touches);
        const delta = (lastPinchDist - dist) * 0.04;
        lastPinchDist = dist;
        camera.position.z = Math.max(ZOOM_MIN_T, Math.min(ZOOM_MAX_T, camera.position.z + delta));
      } else if (e.touches.length === 1) {
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 10 || dy > 10) touchMoved = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!touchMoved) {
        // Tap → raycast for shoe selection
        const rect = container.getBoundingClientRect();
        pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickableMeshes.current);
        if (hits.length > 0) {
          const id = shoeMap.get(hits[0].object.uuid);
          if (id && onSelectRef.current) onSelectRef.current(id);
        }
      } else if (absDx > 55 && absDx > absDy * 1.5) {
        // Horizontal swipe → cycle shoes
        onSwipeRef.current?.(dx < 0 ? 'left' : 'right');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

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
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
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
        touchAction: 'none',
        userSelect: 'none',
      }}
    />
  );
}
