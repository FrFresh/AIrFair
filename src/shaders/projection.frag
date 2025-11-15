uniform sampler2D uVideo;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec4 vid = texture2D(uVideo, vUv);
  float vignette = smoothstep(0.95, 0.5, length(vUv - 0.5));
  vec3 color = mix(vec3(0.0), vid.rgb, vignette);
  gl_FragColor = vec4(color, uOpacity); // translucent fabric look
}




