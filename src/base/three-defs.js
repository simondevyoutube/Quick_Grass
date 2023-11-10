
import * as THREE from 'three';

import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js';
import {ACESFilmicToneMappingShader} from 'three/addons/shaders/ACESFilmicToneMappingShader.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';

import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import { CSM } from 'three/addons/csm/CSM.js';
import { CSMShader } from 'three/addons/csm/CSMShader.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function Float32ToFloat16(data) {
  const data16 = new Uint16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    data16[i] = THREE.DataUtils.toHalfFloat(data[i]);
  }
  return data16;
}

export {
  THREE, EffectComposer, ShaderPass, GammaCorrectionShader, ACESFilmicToneMappingShader,
  RenderPass, FXAAShader, UnrealBloomPass,
  FBXLoader, GLTFLoader, SkeletonUtils, BufferGeometryUtils,
  CSM, CSMShader,
};
