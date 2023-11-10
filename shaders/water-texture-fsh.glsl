#include <common>
#include <packing>

uniform sampler2D colourTexture;
uniform sampler2D depthTexture;
uniform vec3 nearFar;

varying vec2 vUvs;

float GetDepth(float depthSample) {
  float nf = nearFar.x;
  float f_sub_n = nearFar.y;
  float f = nearFar.z;

  float z_final = depthSample;
  return nf / (f_sub_n * z_final - f);
}

void main() {
  vec4 colourSample = texture(colourTexture, vUvs);
  float depthSample = texture(depthTexture, vUvs).r;

  depthSample = -GetDepth(depthSample);

  gl_FragColor = vec4(colourSample.xyz, depthSample);
}