#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;


varying vec2 vUVs;
varying float vWindParams;

uniform sampler2D diffuseTexture;

void main() {
	vec4 colour = texture(diffuseTexture, vUVs).xyzx;

	colour.xyz *= vec3(0.5);
	colour.w *= vWindParams;

	gl_FragColor = colour;
}