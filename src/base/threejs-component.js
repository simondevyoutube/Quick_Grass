import { THREE, RenderPass, ShaderPass, FXAAShader, ACESFilmicToneMappingShader } from './three-defs.js';
import {N8AOPass} from "n8ao";

import Stats from 'three/examples/jsm/libs/stats.module.js';

import * as entity from "./entity.js";
import * as light_component from './render/light-component.js';
import * as shaders from '../game/render/shaders.js';


const HEMI_UP = new THREE.Color().setHex(0x7CBFFF, THREE.SRGBColorSpace);
const HEMI_DOWN = new THREE.Color().setHex(0xE5BCFF, THREE.SRGBColorSpace);
const HEMI_INTENSITY = 0.25;
const LIGHT_INTENSITY = 0.7;
const LIGHT_COLOUR = new THREE.Color().setRGB(0.52, 0.66, 0.99, THREE.SRGBColorSpace);
const LIGHT_FAR = 1000.0;


const GammaCorrectionShader2 = {
	name: 'GammaCorrectionShader2',
	uniforms: {
		'tDiffuse': { value: null }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

    float inverseLerp(float minValue, float maxValue, float v) {
      return (v - minValue) / (maxValue - minValue);
    }
    
    float remap(float v, float inMin, float inMax, float outMin, float outMax) {
      float t = inverseLerp(inMin, inMax, v);
      return mix(outMin, outMax, t);
    }

    vec3 vignette(vec2 uvs) {
      float v1 = smoothstep(0.5, 0.3, abs(uvs.x - 0.5));
      float v2 = smoothstep(0.5, 0.3, abs(uvs.y - 0.5));
      float v = v1 * v2;
      v = pow(v, 0.125);
      v = remap(v, 0.0, 1.0, 0.4, 1.0);
      return vec3(v);
    }

		void main() {
			vec4 tex = texture2D( tDiffuse, vUv );

      tex = LinearTosRGB(tex);
      tex.rgb *= vignette(vUv);

			gl_FragColor = tex;
		}`
};

const Copy2 = {

	name: 'Copy2',

	uniforms: {

		'tDiffuse': { value: null }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 tex = texture2D( tDiffuse, vUv );

			gl_FragColor = tex;

		}`

};


class FakeCSM {
  constructor() {
    this.lights = [{
      color: new THREE.Color(0xFFFFFF),
      lightDirection: new THREE.Vector3(1, 0, 0),
    }];
    this.lightDirection = new THREE.Vector3(1, 0, 0);
  }
  setupMaterial() {}
  updateFrustums() {}
  update() {}

}

export const threejs_component = (() => {

  class ThreeJSController extends entity.Component {
    static CLASS_NAME = 'ThreeJSController';

    get NAME() {
      return ThreeJSController.CLASS_NAME;
    }

    #threejs_;
    #csm_;

    #ssaoPass_;
    #opaqueScene_;
    #opaquePass_;
    #waterScene_;
    #waterPass_;

    #opaqueCamera_;
    #waterCamera_;

    #transparentScene_;
    #transparentPass_;
    #transparentCamera_;

    #waterTexturePass_;

    #fxaaPass_;
    #acesPass_;
    #gammaPass_;
    #copyPass_;

    #grassTimingAvg_;

    constructor() {
      super();

      this.#threejs_ = null;
      this.#ssaoPass_ = null;
      this.#opaqueScene_ = null;
      this.#opaquePass_ = null;
      this.#opaqueCamera_ = null;
      this.#waterScene_ = null;
      this.#waterCamera_ = null;
      this.#waterPass_ = null;
      this.#waterScene_ = null;
      this.#waterCamera_ = null;
      this.#waterPass_ = null;
      this.#waterTexturePass_ = null;
      this.#fxaaPass_ = null;
      this.#acesPass_ = null;
      this.#gammaPass_ = null;
      this.#copyPass_ = null;
      this.#csm_ = null;
      this.grassTimingAvg_ = 0;
      this.timerQuery = null;
    }

    InitEntity() {
      shaders.SetThreeJS(this);

      this.#threejs_ = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
      });
      this.#threejs_.shadowMap.enabled = true;
      this.#threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
      this.#threejs_.setSize(window.innerWidth, window.innerHeight);
      this.#threejs_.domElement.id = 'threejs';
      this.#threejs_.outputColorSpace = THREE.LinearSRGBColorSpace;
  
      document.getElementById('container').appendChild(this.#threejs_.domElement);
  
      window.addEventListener('resize', () => {
        this.onWindowResize_();
      }, false);

      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 0.1;
      const far = 10000.0;
      this.#opaqueCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.#opaqueCamera_.position.set(20, 5, 15);

      this.#waterCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);

      this.#opaqueScene_ = new THREE.Scene();
      this.#opaqueScene_.add(this.#opaqueCamera_);

      this.#waterScene_ = new THREE.Scene();
      this.#waterScene_.add(this.#waterCamera_);

      this.#transparentScene_ = new THREE.Scene();
      this.#transparentCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.#transparentScene_.add(this.#transparentCamera_);

      this.uiCamera_ = new THREE.OrthographicCamera(
          -1, 1, 1, -1, 1, 1000);
      this.uiScene_ = new THREE.Scene();
  
      this.#opaqueScene_.fog = new THREE.FogExp2(0xDFE9F3, 0.0001);
      this.#opaqueScene_.fog.color.setRGB(0.45, 0.8, 1.0, THREE.SRGBColorSpace);

      let light = new THREE.DirectionalLight(0xFFFFFF, LIGHT_INTENSITY);
      light.position.set(-20, 20, 20);
      light.target.position.set(0, 0, 0);
      light.color.copy(LIGHT_COLOUR);

      this.#csm_ = new FakeCSM();

      // VIDEO HACK
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 1.0;
      light.shadow.camera.far = 100.0;
      light.shadow.camera.left = 32;
      light.shadow.camera.right = -32;
      light.shadow.camera.top = 32;
      light.shadow.camera.bottom = -32;
      this.#opaqueScene_.add(light);
      this.#opaqueScene_.add(light.target);

      const lightDir = light.position.clone();
      lightDir.normalize();
      lightDir.multiplyScalar(-1);

      const csmFar = LIGHT_FAR;
      // this.#csm_ = new CSM({
      //   maxFar: csmFar,
      //   fade: true,
      //   cascades: 6,
      //   mode: 'practical',
      //   parent: this.#opaqueScene_,
      //   shadowMapSize: 2048,
      //   lightIntensity: LIGHT_INTENSITY,
      //   lightNear: 1.0,
      //   lightFar: csmFar,
      //   lightDirection: lightDir,
      //   camera: this.#opaqueCamera_
      // });
      // this.#csm_.fade = true;

      for (let i = 0; i < this.#csm_.lights.length; i++) {
        this.#csm_.lights[i].color.copy(LIGHT_COLOUR);
      }

      this.#csm_.updateFrustums();

      this.sun_ = light;

      const waterParams = {
        type: THREE.HalfFloatType,
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        generateMipmaps: false,
      };
      this.waterBuffer_ = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, waterParams);
      this.waterBuffer_.stencilBuffer = false;

      const bufferParams = {
        type: THREE.HalfFloatType,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        generateMipmaps: false,
      };
      this.readBuffer_ = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, bufferParams);
      this.readBuffer_.stencilBuffer = false;
      this.readBuffer_.depthTexture = new THREE.DepthTexture();
      this.readBuffer_.depthTexture.format = THREE.DepthStencilFormat;
      this.readBuffer_.depthTexture.type = THREE.UnsignedInt248Type;

      this.writeBuffer_ = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, bufferParams);
      this.writeBuffer_.stencilBuffer = false;
      this.writeBuffer_.depthTexture = new THREE.DepthTexture();
      this.writeBuffer_.depthTexture.format = THREE.DepthStencilFormat;
      this.writeBuffer_.depthTexture.type = THREE.UnsignedInt248Type;

      this.#opaquePass_ = new RenderPass(this.#opaqueScene_, this.#opaqueCamera_);
      this.#ssaoPass_ = new N8AOPass(this.#opaqueScene_, this.#opaqueCamera_, this.writeBuffer_.width, this.writeBuffer_.height);
      this.#ssaoPass_.configuration.aoRadius = 3.0;
      this.#ssaoPass_.configuration.distanceFalloff = 0.25;
      this.#ssaoPass_.configuration.intensity = 5.0;
      this.#ssaoPass_.configuration.color = new THREE.Color(0, 0, 0);
      // this.#ssaoPass_.configuration.halfRes = true;
      this.#ssaoPass_.beautyRenderTarget.dispose();
      this.#ssaoPass_.beautyRenderTarget = this.writeBuffer_;
      this.#ssaoPass_.setQualityMode("High");

      this.#waterPass_ = new RenderPass(this.#waterScene_, this.#opaqueCamera_);
      this.#transparentPass_ = new RenderPass(this.#transparentScene_, this.#transparentCamera_);

      const f = this.#opaqueCamera_.far;
      const n = this.#opaqueCamera_.near;
      const shader = new shaders.ShaderMaterial('WATER-TEXTURE', {
        uniforms: {
          colourTexture: { value: null },
          depthTexture: { value: null },
          nearFar: { value: new THREE.Vector3(f * n, f - n, f) },
        }
      });

      this.#waterTexturePass_ = new ShaderPass(shader);
      this.#fxaaPass_ = new ShaderPass(FXAAShader);
      this.#acesPass_ = new ShaderPass(ACESFilmicToneMappingShader);
      this.#gammaPass_ = new ShaderPass(GammaCorrectionShader2);
      this.#copyPass_ = new ShaderPass(Copy2);

      const hemiLight = new entity.Entity();
      hemiLight.AddComponent(new light_component.LightComponent({
          hemi: {
              // upColour: 0x7CBFFF,
              // downColour: 0xFFE5BC,
              upColour: HEMI_UP,
              downColour: HEMI_DOWN,
              intensity: HEMI_INTENSITY,
          }
      }));
      hemiLight.SetActive(false);
      hemiLight.Init(this.Parent);

      this.stats_ = new Stats();
      this.grassStats_ = new Stats.Panel('Grass MS', '#0f0', '#020');
      this.stats_.addPanel(this.grassStats_);
      this.stats_.showPanel(0);
      document.body.appendChild(this.stats_.dom);

      this.onWindowResize_();
    }

    get Scene() {
      return this.#opaqueScene_;
    }

    get Camera() {
      return this.#opaqueCamera_;
    }

    get WaterTexture() {
      return this.waterBuffer_.texture;
    }

    get WaterDepthTexture() {
      return this.waterBuffer_.texture;
    }

    getMaxAnisotropy() {
      return this.#threejs_.capabilities.getMaxAnisotropy();
    }

    onWindowResize_() {
      const w = window.innerWidth;
      const h = window.innerHeight
      this.#opaqueCamera_.aspect = w / h;
      this.#opaqueCamera_.updateProjectionMatrix();

      this.#waterCamera_.aspect = this.#opaqueCamera_.aspect;
      this.#waterCamera_.updateProjectionMatrix();

      this.#transparentCamera_.aspect = this.#opaqueCamera_.aspect;
      this.#transparentCamera_.updateProjectionMatrix();
  
      this.#threejs_.setSize(w, h);
      // this.composer_.setSize(window.innerWidth, window.innerHeight);

      this.waterBuffer_.setSize(w, h);
      this.writeBuffer_.setSize(w, h);
      this.readBuffer_.setSize(w, h);
      // this.csm_.updateFrustums();

      this.#ssaoPass_.setSize(w, h);

      this.#waterTexturePass_.setSize(w, h);

      this.#fxaaPass_.material.uniforms['resolution'].value.x = 1 / w;
      this.#fxaaPass_.material.uniforms['resolution'].value.y = 1 / h;

      this.#csm_.updateFrustums();
    }

    swapBuffers_() {
      const tmp = this.writeBuffer_;
      this.writeBuffer_ = this.readBuffer_;
      this.readBuffer_ = tmp;
    }

    SetupMaterial(material) {
      this.#csm_.setupMaterial(material);
    }

    AddSceneObject(obj, params) {
      params = params || {};

      if (params.pass == 'water') {
        this.#waterScene_.add(obj);
      } else if (params.pass == 'transparent') {
        this.#transparentScene_.add(obj);
      } else {
        this.#opaqueScene_.add(obj);
      }
    }

    Render(timeElapsedS) {
      this.#waterCamera_.position.copy(this.#opaqueCamera_.position);
      this.#waterCamera_.quaternion.copy(this.#opaqueCamera_.quaternion);

      this.#transparentCamera_.position.copy(this.#opaqueCamera_.position);
      this.#transparentCamera_.quaternion.copy(this.#opaqueCamera_.quaternion);
      
      this.stats_.begin();

      this.#threejs_.autoClear = true;
      this.#threejs_.autoClearColor = true;
      this.#threejs_.autoClearDepth = true;
      this.#threejs_.autoClearStencil = true;
      this.#threejs_.setRenderTarget(this.writeBuffer_);
      this.#threejs_.clear();
      this.#threejs_.setRenderTarget(this.readBuffer_);
      this.#threejs_.clear();
      this.#threejs_.setRenderTarget(null);

      const gl = this.#threejs_.getContext();
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
      if (this.timerQuery === null && ext !== null) {
        this.timerQuery = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, this.timerQuery);
      }

      this.#opaquePass_.renderToScreen = false;
      this.#opaquePass_.render(this.#threejs_, null, this.writeBuffer_, timeElapsedS, false);
      this.writeBuffer_.ACTIVE_HAS_OPAQUE = true; 
      this.readBuffer_.ACTIVE_HAS_OPAQUE = false; 
      this.swapBuffers_();

      this.#threejs_.autoClear = false;
      this.#threejs_.autoClearColor = false;
      this.#threejs_.autoClearDepth = false;
      this.#threejs_.autoClearStencil = false;

      if (this.timerQuery !== null) {
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        gl.flush();
        const available = gl.getQueryParameter(this.timerQuery, gl.QUERY_RESULT_AVAILABLE);
        if (available) {
          const elapsedTimeInNs = gl.getQueryParameter(this.timerQuery, gl.QUERY_RESULT);
          const elapsedTimeInMs = elapsedTimeInNs / 1000000;
          this.grassTimingAvg_ = this.grassTimingAvg_ * 0.9 + elapsedTimeInMs * 0.1;
          // console.log(`Render time: ${this.grassTimingAvg_}ms`);
          this.grassStats_.update(elapsedTimeInMs, 10);
        }
        this.timerQuery = null;
      }

      this.#ssaoPass_.clear = false;
      this.#ssaoPass_.renderToScreen = false;
      this.#ssaoPass_.beautyRenderTarget = this.readBuffer_;
      this.#ssaoPass_.configuration.autoRenderBeauty = false;
      this.#ssaoPass_.configuration.intensity = 5.0;
      // this.#ssaoPass_.setDisplayMode("Split");
      this.#ssaoPass_.render(this.#threejs_, this.writeBuffer_, null, timeElapsedS, false);
      this.writeBuffer_.ACTIVE_HAS_SSAO_OPAQUE = true; 
      this.readBuffer_.ACTIVE_HAS_SSAO_OPAQUE = false; 
      this.swapBuffers_();

      // SSAO buffer has colour, but other one has depth, which I want to reuse
      // Swapping them should work, but doesn't, and I don't feel like figuring out why.
      this.#copyPass_.renderToScreen = false;
      this.#copyPass_.clear = false;
      this.#copyPass_.material.depthWrite = false;
      this.#copyPass_.material.depthTest = false;
      this.#copyPass_.render(this.#threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.writeBuffer_.ACTIVE_HAS_FINAL_OPAQUE = true; 
      this.readBuffer_.ACTIVE_HAS_FINAL_OPAQUE = false; 

      this.#waterTexturePass_.clear = false;
      this.#waterTexturePass_.renderToScreen = false;
      this.#waterTexturePass_.material.uniforms.colourTexture.value = this.writeBuffer_.texture;
      this.#waterTexturePass_.material.uniforms.depthTexture.value = this.writeBuffer_.depthTexture;
      this.#waterTexturePass_.render(this.#threejs_, this.waterBuffer_, null, timeElapsedS, false);

      this.#waterPass_.clear = false;
      this.#waterPass_.render(this.#threejs_, this.null, this.writeBuffer_, timeElapsedS, false);

      this.#transparentPass_.renderToScreen = false;
      this.#transparentPass_.clear = false;
      this.#transparentPass_.render(this.#threejs_, null, this.writeBuffer_, timeElapsedS, false);
      this.writeBuffer_.ACTIVE_HAS_WATER = true;
      this.readBuffer_.ACTIVE_HAS_WATER = false;
      this.swapBuffers_();

      this.#fxaaPass_.clear = false;
      this.#fxaaPass_.render(this.#threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.swapBuffers_();

      // SHADERPASS SWAPS ORDER OF READ/WRITE BUFFERS
      this.#acesPass_.clear = false;
      this.#acesPass_.material.uniforms.exposure.value = 1.0;
      this.#acesPass_.material.depthTest = false;
      this.#acesPass_.material.depthWrite = false;
      this.#acesPass_.render(this.#threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      this.writeBuffer_.ACTIVE_HAS_ACES = true;
      this.readBuffer_.ACTIVE_HAS_ACES = false;
      this.swapBuffers_();

      this.#gammaPass_.clear = false;
      this.#gammaPass_.renderToScreen = true;
      this.#gammaPass_.render(this.#threejs_, null, this.readBuffer_, timeElapsedS, false);

      this.stats_.end();
    }

    Update(timeElapsed) {
      const player = this.FindEntity('player');
      if (!player) {
        return;
      }
      const pos = player.Position;

      this.#csm_.update();
  
      this.sun_.position.copy(pos);
      this.sun_.position.add(new THREE.Vector3(-10, 40, 10));
      this.sun_.target.position.copy(pos);
      this.sun_.updateMatrixWorld();
      this.sun_.target.updateMatrixWorld();
    }
  }

  return {
      ThreeJSController: ThreeJSController,
  };
})();