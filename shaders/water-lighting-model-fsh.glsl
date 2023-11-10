#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform mat4 projectionMatrix;
uniform mat4 inverseProjectionMatrix;

uniform sampler2D colourTexture;
uniform vec2 resolution;
uniform float time;

varying vec3 vWorldNormal;
varying vec3 vWorldPos;

vec2 ViewToScreen(vec3 pos) {
	vec4 clipPos = projectionMatrix * vec4(pos, 1.0);
	vec3 ndcPos = clipPos.xyz / clipPos.w;
	return ndcPos.xy * 0.5 + 0.5;
}

vec3 ScreenToView(vec2 uv) {
	vec2 ndcPos = uv * 2.0 - 1.0;
	vec4 clipPos = vec4(ndcPos, 0.0, 1.0);
	vec4 viewPos = inverse(projectionMatrix) * clipPos;
	return vec3(viewPos.xy / viewPos.w, 1.0);
}

// TODO: This was lazily done to just get it working.
// Do not use this for anything other than this demo.
vec4 TraceRay(vec3 rayWorldOrigin, vec3 rayWorldDir) {
	const int MAX_COUNT = 32;

	vec3 rayViewPos = (viewMatrix * vec4(rayWorldOrigin, 1.0)).xyz;
	vec3 rayViewDir = (viewMatrix * vec4(rayWorldDir, 0.0)).xyz;

	vec3 rayPos = rayViewPos;
	vec3 rayDir = rayViewDir;

	float dist = 0.01;
	for (int i = 0; i < MAX_COUNT; i++) {
		rayPos += rayDir * dist;
		dist *= 1.5;

		vec2 coords = ViewToScreen(rayPos);
		float depthAtCoord = texture(colourTexture, coords).w;
		float rayDepth = -rayPos.z;

		if (depthAtCoord < rayDepth) {
			if (depthAtCoord < -rayViewPos.z) {
				continue;
			}
			if (coords.y < 0.0 || coords.y > 1.0) {
				break;
			}
			return vec4(texture(colourTexture, coords).xyz, 1.0);
		}
	}
	return vec4(0.0);
}

vec3 WaterNormal2(vec3 pos, float falloff) {
	vec3 noiseNormal = FBM_D_1_4(vec3(pos.xz * 0.4, time * 0.8), 1).yzw;

	return normalize(vec3(0.0, 1.0, 0.0) + noiseNormal * 0.5 * falloff);
}

void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	#include <lights_phong_fragment>

	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

  vec2 coords = gl_FragCoord.xy / resolution;
  float sceneZ = texture(colourTexture, coords).w;
  float waterZ = vViewPosition.z;
	float waterDepth = sceneZ - waterZ;
  float waterFalloff = smoothstep(0.0, 2.0, waterDepth);

	float dist = distance(cameraPosition, vWorldPos);
	vec3 viewDir = normalize(cameraPosition - vWorldPos);
	// vec3 waterNormal = WaterNormal(vWorldPos, sceneZ);

	float waterNormalFalloff = pow(saturate(dot(vec3(0.0, 1.0, 0.0), viewDir)), 2.0);// * easeIn(linearstep(100.0, 0.0, dist), 3.0);
	vec3 waterNormal = WaterNormal2(vWorldPos, waterNormalFalloff);


	float fresnel = pow(saturate(dot(waterNormal, viewDir)), 1.0);

	vec3 reflectedDir = reflect(-viewDir, waterNormal);
	vec3 refractDir = refract(-viewDir, waterNormal, 1.0 / 1.33);

	vec4 tracedReflection = TraceRay(vWorldPos, reflectedDir);
	vec3 tracedSky = CalculateSkyLighting(reflectedDir, viewDir);
	float edgeFalloff = smoothstep(0.5, 0.3, abs(coords.x - 0.5));
	edgeFalloff = remap(edgeFalloff, 0.0, 1.0, 0.25, 1.0);
	vec3 reflectedColour = mix(tracedSky, tracedReflection.xyz, tracedReflection.w * edgeFalloff);
  vec4 colourSample = texture(colourTexture, coords + noise23(vec3(vWorldPos.xz, time)) * 0.05 * waterNormalFalloff);
	// vec4 tracedRefraction = TraceRay(vWorldPos, refractDir);

	vec3 waterColour = mix(colourSample.xyz, vec3(0.2, 0.2, 0.5), waterFalloff);
	vec4 froth = vec4(vec3(1.0), remap(noise13(vec3(vWorldPos.xz * 10.0, time * 2.0)), -1.0, 1.0, 0.0, 1.0)) * smoothstep(0.25, 0.0, waterDepth);
	waterColour = mix(waterColour, froth.xyz, froth.w);

  outgoingLight = mix(reflectedColour, waterColour, fresnel);
	outgoingLight = mix(colourSample.xyz, outgoingLight, smoothstep(0.0, 0.1, waterDepth));


	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}