uniform float time;


varying vec3 vWorldPosition;
varying vec3 vWorldNormal;



void main() {
  vec3 viewDir = normalize(vWorldPosition - cameraPosition);
  vec3 colour = CalculateSkyLighting(viewDir, vWorldNormal);

  gl_FragColor = vec4(colour, 1.0);
}