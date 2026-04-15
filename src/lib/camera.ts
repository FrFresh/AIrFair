import { PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';

const targets: Record<string, { pos: Vector3; look: Vector3 }> = {
  entrance: { pos: new Vector3(0, 1.8, 7), look: new Vector3(0, 1.4, 0) },
  // Pulled back to z=4.5 so the full panel (4.8 units tall) is visible,
  // look target raised to y=2.2 to center on the player image.
  aj1:  { pos: new Vector3(-4, 2.0, 4.5), look: new Vector3(-4, 2.2, -0.8) },
  aj3:  { pos: new Vector3(0,  2.0, 4.5), look: new Vector3(0,  2.2, -0.8) },
  aj12: { pos: new Vector3(4,  2.0, 4.5), look: new Vector3(4,  2.2, -0.8) },
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
