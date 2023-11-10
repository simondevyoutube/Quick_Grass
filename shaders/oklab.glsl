/////////////////////////////////////////////////////////////////////////
//
// OKLab stuff, mostly based off https://www.shadertoy.com/view/ttcyRS
//
/////////////////////////////////////////////////////////////////////////

const mat3 kLMStoCONE = mat3(
    4.0767245293, -1.2681437731, -0.0041119885,
    -3.3072168827, 2.6093323231, -0.7034763098,
    0.2307590544, -0.3411344290,  1.7068625689);

const mat3 kCONEtoLMS = mat3(
    0.4121656120, 0.2118591070, 0.0883097947,
    0.5362752080, 0.6807189584, 0.2818474174,
    0.0514575653, 0.1074065790, 0.6302613616);

vec3 rgbToOklab(vec3 c) {
  vec3 lms = kCONEtoLMS * c;

  return sign(lms)*pow(abs(lms), vec3(0.3333333333333));
}

vec3 oklabToRGB(vec3 c) {
  vec3 lms = c;
  
  return kLMStoCONE * (lms * lms * lms);
}


#ifndef USE_OKLAB
#define col3 vec3
#else
vec3 col3(float r, float g, float b) {
  return rgbToOklab(vec3(r, g, b));
}

vec3 col3(vec3 v) {
  return rgbToOklab(v);
}

vec3 col3(float v) {
  return rgbToOklab(vec3(v));
}
#endif