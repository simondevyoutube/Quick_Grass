varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;


void main() {
  vec4 localSpacePosition = vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * localSpacePosition;

  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}