

#define PHONG


varying vec2 vUVs;
varying float vWindParams;

uniform vec2 dustSize;
uniform float time;

uniform sampler2D heightmap;
uniform vec3 heightmapParams;

attribute vec3 offset;


const float PI = 3.1415926535897932384626433832795;

void main() {

vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif

  {
    vec3 baseWorldPosition = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + offset;
    float hashSample = hash12(baseWorldPosition.xz);

    float hashedTime = time + hashSample * 100.0;

    float windDir = noise12(baseWorldPosition.xz * 0.05 + 0.5 * time);
    // float windNoiseSample = noise12(grassBladeWorldPos.xz * 0.25 + time * 1.1);
    // float windLeanAngle = saturate(remap(windNoiseSample, -1.0, 1.0, 0.25, 1.0));
    // windLeanAngle = easeIn(windLeanAngle, 2.0) * 1.5;
    vec3 windAxis = vec3(sin(windDir), 0.0, -cos(windDir));

    const float TIME_REPEAT_PERIOD = 4.0;
    float repeatingTime = mod(hashedTime, TIME_REPEAT_PERIOD);
    float fadeInOut = (
        smoothstep(0.0, TIME_REPEAT_PERIOD * 0.25, repeatingTime) *
        smoothstep(TIME_REPEAT_PERIOD, TIME_REPEAT_PERIOD * 0.75, repeatingTime));

    vec3 windOffset = offset + windAxis * repeatingTime * 5.0;

    vec3 scaledPosition = position;
    scaledPosition.xy *= dustSize;

    vec3 scaledOffsetPosition = scaledPosition + windOffset;

    vec3 worldPosition = (modelMatrix * vec4(scaledOffsetPosition, 1.0)).xyz;

    vec3 z = normalize(cameraPosition - worldPosition);
    vec3 x = normalize(cross(vec3(0.0, 1.0, 0.0), z));
    vec3 y = normalize(cross(z, x));
    mat3 alignMatrix = mat3(x, y, z);
    transformed = alignMatrix * scaledPosition + windOffset;

    vec2 heightmapUV = vec2(
        remap(worldPosition.x, -heightmapParams.z * 0.5, heightmapParams.z * 0.5, 0.0, 1.0),
        remap(worldPosition.z, -heightmapParams.z * 0.5, heightmapParams.z * 0.5, 1.0, 0.0));
    float terrainHeight = texture2D(heightmap, heightmapUV).x * heightmapParams.x - heightmapParams.y;
    transformed.y += terrainHeight;

    vWindParams = fadeInOut;

    float randomAngle = remap(hashSample, 0.0, 1.0, 0.0, 2.0 * PI);
    vUVs = rotate2D(randomAngle) * uv;

    // vec3 worldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + windOffset;
    // vec3 viewCenter = normalize(worldCenter - cameraPosition);
    // vec3 viewXZ = -normalize(vec3(viewCenter.x, 0.0, viewCenter.z));

    // float i = floor(16.0 * (atan(viewXZ.z, viewXZ.x) + PI) / (2.0 * PI));
    // float j = floor(16.0 * offset.w / (2.0 * PI));
    // vBillboardLayer = vec2(i * 16.0 + j, smoothstep(350.0, 300.0, dist));
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}