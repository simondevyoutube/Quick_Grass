// Virtually all of these were taken from: https://www.shadertoy.com/view/ttc3zr

uvec4 murmurHash42(uvec2 src) {
    const uint M = 0x5bd1e995u;
    uvec4 h = uvec4(1190494759u, 2147483647u, 3559788179u, 179424673u);
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

uint murmurHash11(uint src) {
  const uint M = 0x5bd1e995u;
  uint h = 1190494759u;
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

uint murmurHash12(uvec2 src) {
  const uint M = 0x5bd1e995u;
  uint h = 1190494759u;
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src.x; h *= M; h ^= src.y;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

uint murmurHash13(uvec3 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

uvec2 murmurHash22(uvec2 src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src.x; h *= M; h ^= src.y;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

uvec2 murmurHash21(uint src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

uvec2 murmurHash23(uvec3 src) {
    const uint M = 0x5bd1e995u;
    uvec2 h = uvec2(1190494759u, 2147483647u);
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

uvec3 murmurHash31(uint src) {
    const uint M = 0x5bd1e995u;
    uvec3 h = uvec3(1190494759u, 2147483647u, 3559788179u);
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

uvec3 murmurHash33(uvec3 src) {
  const uint M = 0x5bd1e995u;
  uvec3 h = uvec3(1190494759u, 2147483647u, 3559788179u);
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

// 3 outputs, 3 inputs
vec3 hash33(vec3 src) {
  uvec3 h = murmurHash33(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 1 output, 1 input
float hash11(float src) {
  uint h = murmurHash11(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 1 output, 2 inputs
float hash12(vec2 src) {
  uint h = murmurHash12(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 1 output, 3 inputs
float hash13(vec3 src) {
    uint h = murmurHash13(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 2 outputs, 1 input
vec2 hash21(float src) {
  uvec2 h = murmurHash21(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 3 outputs, 1 input
vec3 hash31(float src) {
    uvec3 h = murmurHash31(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 2 outputs, 2 inputs
vec2 hash22(vec2 src) {
  uvec2 h = murmurHash22(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

// 4 outputs, 2 inputs
vec4 hash42(vec2 src) {
  uvec4 h = murmurHash42(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}


// 2 outputs, 3 inputs
vec2 hash23(vec3 src) {
    uvec2 h = murmurHash23(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

float noise11(float p) {
  float i = floor(p);

  float f = fract(p);
  float u = smoothstep(0.0, 1.0, f);

	float val = mix( hash11(i + 0.0),
                   hash11(i + 1.0), u);
  return val * 2.0 - 1.0;
}

float noise12(vec2 p) {
  vec2 i = floor(p);

  vec2 f = fract(p);
  vec2 u = smoothstep(vec2(0.0), vec2(1.0), f);

	float val = mix( mix( hash12( i + vec2(0.0, 0.0) ), 
                        hash12( i + vec2(1.0, 0.0) ), u.x),
                   mix( hash12( i + vec2(0.0, 1.0) ), 
                        hash12( i + vec2(1.0, 1.0) ), u.x), u.y);
  return val * 2.0 - 1.0;
}

float noise13(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  return mix(mix(mix( hash13(i+vec3(0.0, 0.0, 0.0)), 
                      hash13(i+vec3(1.0, 0.0, 0.0)),f.x),
                 mix( hash13(i+vec3(0.0, 1.0, 0.0)), 
                      hash13(i+vec3(1.0, 1.0, 0.0)),f.x),f.y),
             mix(mix( hash13(i+vec3(0.0, 0.0, 1.0)), 
                      hash13(i+vec3(1.0, 0.0, 1.0)),f.x),
                 mix( hash13(i+vec3(0.0, 1.0, 1.0)), 
                      hash13(i+vec3(1.0, 1.0, 1.0)),f.x),f.y),f.z);
}

vec2 noise23(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  return mix(mix(mix( hash23(i+vec3(0.0, 0.0, 0.0)), 
                      hash23(i+vec3(1.0, 0.0, 0.0)),f.x),
                 mix( hash23(i+vec3(0.0, 1.0, 0.0)), 
                      hash23(i+vec3(1.0, 1.0, 0.0)),f.x),f.y),
             mix(mix( hash23(i+vec3(0.0, 0.0, 1.0)), 
                      hash23(i+vec3(1.0, 0.0, 1.0)),f.x),
                 mix( hash23(i+vec3(0.0, 1.0, 1.0)), 
                      hash23(i+vec3(1.0, 1.0, 1.0)),f.x),f.y),f.z);
}

vec2 noise22(vec2 p) {
	vec2 i = floor(p);

	vec2 f = fract(p);
	vec2 u = smoothstep(vec2(0.0), vec2(1.0), f);

	vec2 val = mix( mix( hash22( i + vec2(0.0, 0.0) ), 
											 hash22( i + vec2(1.0, 0.0) ), u.x),
									mix( hash22( i + vec2(0.0, 1.0) ), 
											 hash22( i + vec2(1.0, 1.0) ), u.x), u.y);
	return val * 2.0 - 1.0;
}

// The MIT License
// Copyright © 2017 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/
vec4 noised_1_3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
    
  // quintic interpolant
  vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  vec3 du = 30.0*f*f*(f*(f-2.0)+1.0);
    
  // gradients
  vec3 ga = hash33( i+vec3(0.0,0.0,0.0) ) * 2.0 - 1.0;
  vec3 gb = hash33( i+vec3(1.0,0.0,0.0) ) * 2.0 - 1.0;
  vec3 gc = hash33( i+vec3(0.0,1.0,0.0) ) * 2.0 - 1.0;
  vec3 gd = hash33( i+vec3(1.0,1.0,0.0) ) * 2.0 - 1.0;
  vec3 ge = hash33( i+vec3(0.0,0.0,1.0) ) * 2.0 - 1.0;
	vec3 gf = hash33( i+vec3(1.0,0.0,1.0) ) * 2.0 - 1.0;
  vec3 gg = hash33( i+vec3(0.0,1.0,1.0) ) * 2.0 - 1.0;
  vec3 gh = hash33( i+vec3(1.0,1.0,1.0) ) * 2.0 - 1.0;
    
  // projections
  float va = dot( ga, f-vec3(0.0,0.0,0.0) );
  float vb = dot( gb, f-vec3(1.0,0.0,0.0) );
  float vc = dot( gc, f-vec3(0.0,1.0,0.0) );
  float vd = dot( gd, f-vec3(1.0,1.0,0.0) );
  float ve = dot( ge, f-vec3(0.0,0.0,1.0) );
  float vf = dot( gf, f-vec3(1.0,0.0,1.0) );
  float vg = dot( gg, f-vec3(0.0,1.0,1.0) );
  float vh = dot( gh, f-vec3(1.0,1.0,1.0) );
	
  // interpolations
  return vec4( va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + (-va+vb+vc-vd+ve-vf-vg+vh)*u.x*u.y*u.z,    // value
                ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + (-ga+gb+gc-gd+ge-gf-gg+gh)*u.x*u.y*u.z +   // derivatives
                du * (vec3(vb,vc,ve) - va + u.yzx*vec3(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh) ));
}

float FBM_1_2(vec2 p, int octaves, float persistence, float lacunarity) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise12(p * frequency);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  total /= normalization;
  total = total * 0.5 + 0.5;

  return total;
}

float FBM_1_3(vec3 p, int octaves, float persistence, float lacunarity) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise13(p * frequency);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  total /= normalization;
  total = total * 0.5 + 0.5;

  return total;
}

const mat3 m3  = mat3( 0.00,  0.80,  0.60,
                      -0.80,  0.36, -0.48,
                      -0.60, -0.48,  0.64 );
const mat3 m3i = mat3( 0.00, -0.80, -0.60,
                       0.80,  0.36, -0.48,
                       0.60, -0.48,  0.64 );

vec4 FBM_D_1_4(in vec3 x, int octaves) {
  float f = 1.98;  // could be 2.0
  float s = 0.49;  // could be 0.5
  float a = 0.0;
  float b = 0.5;
  vec3  d = vec3(0.0);
  mat3  m = mat3(
      1.0,0.0,0.0,
      0.0,1.0,0.0,
      0.0,0.0,1.0);
  for( int i=0; i < octaves; i++ )
  {
      vec4 n = noised_1_3(x);
      a += b*n.x;          // accumulate values
      d += b*m*n.yzw;      // accumulate derivatives
      b *= s;
      x = f*m3*x;
      m = f*m3i*m;
  }
  return vec4( a, d );
}
