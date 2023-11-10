

#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

varying vec3 vWorldNormal;

uniform vec2 bugsSize;
uniform vec4 bugsParams;
uniform float time;

uniform sampler2D heightmap;
uniform vec3 heightmapParams;

attribute vec3 offset;


void main() {
  #include <uv_vertex>
  #include <color_vertex>
  #include <morphcolor_vertex>
  // #include <beginnormal_vertex>

  vec3 objectNormal = vec3(0.0, 1.0, 0.0);
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif

  // #include <begin_vertex>

vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif

  vec4 bugHashVal = hash42(offset.xz);

  float BUG_SCALE = mix(0.35, 0.55, bugHashVal.z);
  transformed *= BUG_SCALE;

  const float FLAP_SPEED = 20.0;
  float flapTimeSample = time * FLAP_SPEED + bugHashVal.x * 100.0;
  transformed.y += mix(0.0, sin(flapTimeSample), abs(position.x)) * BUG_SCALE;
  transformed.x *= abs(cos(flapTimeSample));

  float TIME_PERIOD = 20.0;
  float repeatingTime = TIME_PERIOD * 0.5 - abs(mod(time, TIME_PERIOD) - TIME_PERIOD * 0.5);

  float height = noise11(time * 3.0 + bugHashVal.x * 100.0);
  // transformed.y += height * 0.5;

  // Loop
  float loopTime = time * 0.5 + bugHashVal.x * 123.23;
  float loopSize = 2.0;
  vec3 bugsOffset = vec3(sin(loopTime) * loopSize, height * 0.125, cos(loopTime) * loopSize) + offset;

  // Forward
  transformed = rotateY(-loopTime + PI / 2.0) * transformed;
  transformed += bugsOffset;

  // Center
  vec3 bugCenter = offset;

  vec3 bugsWorldPos = (modelMatrix * vec4(bugCenter, 1.0)).xyz;
  vec2 heightmapUV = vec2(
      remap(bugsWorldPos.x, -heightmapParams.z * 0.5, heightmapParams.z * 0.5, 0.0, 1.0),
      remap(bugsWorldPos.z, -heightmapParams.z * 0.5, heightmapParams.z * 0.5, 1.0, 0.0));
  float terrainHeight = texture2D(heightmap, heightmapUV).x * heightmapParams.x - heightmapParams.y;
  transformed.y += terrainHeight;

  if (terrainHeight < -11.0) {
    transformed.y -= 1000.0;
  }

  objectNormal = normal;

  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>

  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <displacementmap_vertex>

  // #include <project_vertex>
  vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  vViewPosition = - mvPosition.xyz;
  #include <worldpos_vertex>
  #include <envmap_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>

  vWorldNormal = (modelMatrix * vec4(normal.xyz, 0.0)).xyz;
}