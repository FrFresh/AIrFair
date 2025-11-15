import { PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';

const targets: Record<string, { pos: Vector3; look: Vector3 }> = {
  entrance: { pos: new Vector3(0, 1.6, 6), look: new Vector3(0, 1.2, 0) },
  aj1: { pos: new Vector3(-4, 1.6, 2), look: new Vector3(-4, 1.2, 0) },
  aj3: { pos: new Vector3(0, 1.6, 2), look: new Vector3(0, 1.2, 0) },
  aj12: { pos: new Vector3(4, 1.6, 2), look: new Vector3(4, 1.2, 0) }
};

export function moveCameraTo(
  camera: PerspectiveCamera,
  label: keyof typeof targets,
  onUpdate?: () => void
) {
  const t = targets[label];
  
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
