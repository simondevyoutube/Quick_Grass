
varying vec2 vUvs;


void main() {
  vec4 localSpacePosition = vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * localSpacePosition;

  vUvs = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}