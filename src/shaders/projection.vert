uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  p.z += sin(p.y*3.0 + uTime*0.6)*0.02;  // gentle flutter
  p.z += sin(p.x*2.0 + uTime*0.4)*0.01;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}




