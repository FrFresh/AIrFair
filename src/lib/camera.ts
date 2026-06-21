import { PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';

type Target = { pos: Vector3; look: Vector3 };

// Desktop framing (wide aspect)
const desktopTargets: Record<string, Target> = {
  lobby:    { pos: new Vector3(0, 3.2, 22), look: new Vector3(0, 2.6, 8) },
  // Wide establishing shot — pulled back to take in the vast open hall,
  // the three pedestals (x = ±8) and the tall hanging banners behind them.
  entrance: { pos: new Vector3(0, 3.8, 17), look: new Vector3(0, 3.4, -3) },
  // Per-shoe: camera sits in front of each pedestal at eye level, framing
  // the shoe in the foreground with its ceiling-hung banner rising behind.
  aj1:  { pos: new Vector3(-8, 3.4, 7.5), look: new Vector3(-8, 4.0, -2.8) },
  aj3:  { pos: new Vector3(0,  3.4, 7.5), look: new Vector3(0,  4.0, -2.8) },
  aj12: { pos: new Vector3(8,  3.4, 7.5), look: new Vector3(8,  4.0, -2.8) },
};

// Mobile framing (tall portrait aspect): pull the camera back and aim a touch
// lower so the full banner AND the shoe fit in frame above the bottom card —
// no pinch-to-zoom needed.
const mobileTargets: Record<string, Target> = {
  lobby:    { pos: new Vector3(0, 3.2, 24), look: new Vector3(0, 2.6, 8) },
  entrance: { pos: new Vector3(0, 4.0, 21), look: new Vector3(0, 3.4, -3) },
  aj1:  { pos: new Vector3(-8, 3.6, 9.0), look: new Vector3(-8, 3.4, -2.8) },
  aj3:  { pos: new Vector3(0,  3.6, 9.0), look: new Vector3(0,  3.4, -2.8) },
  aj12: { pos: new Vector3(8,  3.6, 9.0), look: new Vector3(8,  3.4, -2.8) },
};

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

export function moveCameraTo(
  camera: PerspectiveCamera,
  label: keyof typeof desktopTargets,
  onUpdate?: () => void
) {
  const t = (isMobile() ? mobileTargets : desktopTargets)[label];

  gsap.to(camera.position, {
    x: t.pos.x,
    y: t.pos.y,
    z: t.pos.z,
    duration: 0.9,
    ease: 'power2.inOut',
    onUpdate
  });

  // lookAt tween: compute direction each tick
  const look = t.look.clone();
  gsap.to({ x: 0 }, {
    x: 1,
    duration: 0.9,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(look)
  });
}
