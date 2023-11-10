import {THREE} from '../../base/three-defs.js';

import * as entity from "../../base/entity.js";
import * as shaders from "./shaders.js";


export class RenderSkyComponent extends entity.Component {
  static CLASS_NAME = 'RenderSkyComponent';

  get NAME() {
    return RenderSkyComponent.CLASS_NAME;
  }

  constructor() {
    super();
  }

  InitEntity() {
    const uniforms = {
      "time": { value: 0.0 },
    };

    const skyGeo = new THREE.SphereGeometry(5000, 32, 15);
    const skyMat = new shaders.ShaderMaterial('SKY', {
        uniforms: uniforms,
        side: THREE.BackSide
    });

    this.sky_ = new THREE.Mesh(skyGeo, skyMat);
    this.sky_.castShadow = false;
    this.sky_.receiveShadow = false;

    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
    threejs.AddSceneObject(this.sky_);
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