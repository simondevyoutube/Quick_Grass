import {THREE} from './base/three-defs.js';

import * as entity from './base/entity.js';
import * as terrain_component from './base/render/terrain-component.js';
import * as shaders from './game/render/shaders.js';


export const demo_builder = (() => {

  class DemoBuilder extends entity.Component {
    static CLASS_NAME = 'DemoBuilder';

    get NAME() {
      return DemoBuilder.CLASS_NAME;
    }

    constructor(params) {
      super();

      this.params_ = params;
      this.spawned_ = false;
      this.materials_ = {};
    }

    LoadMaterial_(albedoName, normalName, roughnessName, metalnessName) {
      const textureLoader = new THREE.TextureLoader();
      const albedo = textureLoader.load('./textures/' + albedoName);
      albedo.anisotropy = this.FindEntity('threejs').GetComponent('ThreeJSController').getMaxAnisotropy();
      albedo.wrapS = THREE.RepeatWrapping;
      albedo.wrapT = THREE.RepeatWrapping;
      albedo.colorSpace = THREE.SRGBColorSpace;

      const material = new shaders.GameMaterial('PHONG', {
        map: albedo,
        color: 0x303030,
      });

      return material;
    }

    BuildHackModel_() {
      this.materials_.checkerboard = this.LoadMaterial_(
          'whitesquare.png', null, null, null);

      const ground = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
          this.materials_.checkerboard);
      ground.castShadow = true;
      ground.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(ground, 'built-in.', 'ground');

      const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
          this.materials_.checkerboard);
      box.castShadow = true;
      box.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(box, 'built-in.', 'box');

      const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(1, 16, 16),
          this.materials_.checkerboard);
      sphere.castShadow = true;
      sphere.receiveShadow = true;

      this.FindEntity('loader').GetComponent('LoadController').AddModel(sphere, 'built-in.', 'sphere');

      this.currentTime_ = 0.0;
    }

    Update(timeElapsed) {
      this.currentTime_ += timeElapsed;

      if (this.materials_.checkerboard && this.materials_.checkerboard.userData.shader) {
        this.materials_.checkerboard.userData.shader.uniforms.iTime.value = this.currentTime_;
        this.materials_.checkerboard.needsUpdate = true;
      }

      if (this.spawned_) {
        return;
      }

      this.spawned_ = true;

      this.BuildHackModel_();

      const terrain = new entity.Entity('terrain');
      terrain.AddComponent(new terrain_component.TerrainComponent({}));
      terrain.SetActive(true);
      terrain.Init();
    }
  };

  return {
    DemoBuilder: DemoBuilder
  };

})();