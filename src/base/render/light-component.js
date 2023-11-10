import {THREE} from '../three-defs.js';

import * as entity from "../entity.js";


export class LightComponent extends entity.Component {
  static CLASS_NAME = 'LightComponent';

  get NAME() {
    return LightComponent.CLASS_NAME;
  }

  #params_;
  #light_;

  constructor(params) {
    super();

    this.#params_ = params;
    this.#light_ = null;
  }

  Destroy() {
    this.light_.removeFromParent();
  }

  InitEntity() {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
    if (this.#params_.hemi) {
      const params = this.#params_.hemi;
      this.#light_ = new THREE.HemisphereLight(params.upColour, params.downColour, params.intensity);
      threejs.AddSceneObject(this.#light_);
    }
  }

  Update(timeElapsed) {
    const player = this.FindEntity('player');
    if (!player) {
      return;
    }
    const pos = player.Position;

    if (this.sky_) {
      this.sky_.material.uniforms.time.value += timeElapsed;
    }

    this.sky_.position.copy(pos);
  }
}