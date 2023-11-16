#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform sampler2D heightmap;
uniform vec4 heightParams;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vTerrainColour;


void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>

  vec4 heightSample = texture2D(heightmap, uv);
  float height = heightSample.x * heightParams.z - heightParams.w;

  vec3 terrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float distToVertex = distance(cameraPosition, terrainWorldPos);

  float isSandy = linearstep(-11.0, -14.0, height);

  vec2 hashGrassColour = hash22(vec2(position.x, position.z));
  // vec3 baseColour = mix(vec3(0.02, 0.2, 0.01), vec3(0.025, 0.1, 0.01), hashGrassColour.x);
  // vec3 tipColour = mix(vec3(0.5, 0.7, 0.1), vec3(0.4, 0.5, 0.025), hashGrassColour.y);
  // vec3 tipColour = vec3(0.2, 0.35, 0.05);
  // vec3 baseColour = vec3(0.02, 0.2, 0.01);
  // vec3 tipColour = vec3(0.5, 0.5, 0.1);

  vec3 baseColour = vec3(0.05, 0.2, 0.01);
  vec3 tipColour = vec3(0.3, 0.3, 0.1);

  float aoDist = smoothstep(25.0, 50.0, distToVertex);
  float colourDist = smoothstep(50.0, 100.0, distToVertex);
  float ao = mix(0.25, 1.0, aoDist);
  ao = mix(ao, 1.0, isSandy);

  vec3 SAND_COLOUR = vec3(0.6, 0.4, 0.2);

  vTerrainColour = mix(baseColour, tipColour, colourDist);
  vTerrainColour = mix(vTerrainColour, SAND_COLOUR, smoothstep(-11.0, -14.0, height));
  vTerrainColour *= ao;


	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif

  vWorldNormal = (modelMatrix * vec4(normal.xyz, 0.0)).xyz;
	vWorldPosition = worldPosition.xyz;
}
