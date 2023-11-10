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
// #include <lights_phong_pars_fragment>

uniform sampler2D grassTexture;
uniform vec3 grassLODColour;
uniform float time;
uniform mat3 normalMatrix;

varying vec3 vGrassColour;
varying vec4 vGrassParams;
varying vec3 vNormal2;
varying vec3 vWorldPosition;

varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};


void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float wrap = 0.5;
	float dotNL = saturate( (dot( geometry.normal, directLight.direction ) + wrap) / (1.0 + wrap) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;

  // Backscatter fakery
	wrap = 0.5;
  float backLight = saturate((dot(geometry.viewDir, -directLight.direction) + wrap) / (1.0 + wrap));
  float falloff = 0.5;//mix(0.5, pow(1.0 - saturate(dot(geometry.viewDir, geometry.normal)), 2.0), 1.0) * 0.5;
  vec3 scatter = directLight.color * pow(backLight, 1.0) * falloff *  BRDF_Lambert(material.diffuseColor);

  reflectedLight.indirectDiffuse += scatter * (1.0 - vGrassParams.z);
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				      RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong

#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>


void main() {
	vec3 viewDir = normalize(cameraPosition - vWorldPosition);

	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );

  // Grass
  float heightPercent = vGrassParams.x;
  float height = vGrassParams.y;
	float lodFadeIn = vGrassParams.z;
	float lodFadeOut = 1.0 - lodFadeIn;

  float grassMiddle = mix(
			smoothstep(abs(vGrassParams.w - 0.5), 0.0, 0.1), 1.0, lodFadeIn);

  float isSandy = saturate(linearstep(-11.0, -14.0, height));

	float density = 1.0 - isSandy;

	// Density is in the range [0, 1]
	// 0 being no grass
	// 1 being full grass
	float aoForDensity = mix(1.0, 0.25, density);
  float ao = mix(aoForDensity, 1.0, easeIn(heightPercent, 2.0));

  diffuseColor.rgb *= vGrassColour;
	diffuseColor.rgb *= mix(0.85, 1.0, grassMiddle);
  diffuseColor.rgb *= ao;


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

	vec3 normal2 = normalize(vNormal2);
	normal = normalize(mix(vNormal, normal2, vGrassParams.w));

	#include <emissivemap_fragment>
	// #include <lights_phong_fragment>

  BlinnPhongMaterial material;
  material.diffuseColor = diffuseColor.rgb;
  material.specularColor = specular;

	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	// #include <fog_fragment>

	gl_FragColor.xyz = CalculateFog(gl_FragColor.xyz, viewDir, vFogDepth);

	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}