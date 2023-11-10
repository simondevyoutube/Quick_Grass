import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import * as entity from '../base/entity.js';
import * as passes from '../base/passes.js';
import * as terrain_component from '../base/render/terrain-component.js';

export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    static CLASS_NAME = 'ThirdPersonCamera';

    get NAME() {
      return ThirdPersonCamera.CLASS_NAME;
    }

    constructor(params) {
      super();

      this.params_ = params;
      this.camera_ = params.camera;

      this.currentPosition_ = new THREE.Vector3();
      this.currentLookat_ = new THREE.Vector3();
    }

    InitEntity() {
      this.SetPass(passes.Passes.CAMERA);
    }

    CalculateIdealOffset_() {
      const idealOffset = new THREE.Vector3(0, 0.5, -8);
      // idealOffset.multiplyScalar(10.0);
      idealOffset.applyQuaternion(this.Parent.Quaternion);
      idealOffset.add(this.Parent.Position);

      // idealOffset.y = Math.min(idealOffset.y, height + 1.5);
      // idealOffset.y += (this.Parent.Position.y - 1.5 + height);

      return idealOffset;
    }

    CalculateIdealLookat_() {
      const idealLookat = new THREE.Vector3(0, 1.25, 4);
      idealLookat.applyQuaternion(this.Parent.Quaternion);
      idealLookat.add(this.Parent.Position);
      return idealLookat;
    }

    Update(timeElapsed) {
      const terrain = this.FindEntity('terrain');
      if (terrain) {
        const terrainComponent = terrain.GetComponent(terrain_component.TerrainComponent.CLASS_NAME);
        if (!terrainComponent.IsReady()) {
          return;
        }

        const idealOffset = this.CalculateIdealOffset_();
        const idealLookat = this.CalculateIdealLookat_();
  
        const height = terrainComponent.GetHeight(idealOffset.x, idealOffset.z);
        idealOffset.y = height + 4.25;

        // const t = 0.05;
        // const t = 4.0 * timeElapsed;
        const t = 1.0 - Math.pow(0.0001, timeElapsed);
  
        this.currentPosition_.lerp(idealOffset, t);
        this.currentLookat_.lerp(idealLookat, t);
  
        this.camera_.position.copy(this.currentPosition_);
        this.camera_.lookAt(this.currentLookat_); 
      }
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();