import {THREE} from '../base/three-defs.js';

import * as entity from '../base/entity.js';

import {player_input} from './player-input.js';
import {player_entity} from './player-entity.js'
import {third_person_camera} from './third-person-camera.js';
import {demo_builder} from '../demo-builder.js';


export const spawners = (() => {

  class PlayerSpawner extends entity.Component {
    static CLASS_NAME = 'PlayerSpawner';

    get NAME() {
      return PlayerSpawner.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn() {
      const player = new entity.Entity('player');
      player.SetPosition(new THREE.Vector3(316, 15, -560));
      player.AddComponent(new player_input.PlayerInput(this.params_));
      player.AddComponent(new player_entity.BasicCharacterController(this.params_));
      player.AddComponent(new third_person_camera.ThirdPersonCamera(this.params_));
      player.Init();
      player.SetQuaternion(new THREE.Quaternion(0, 0.448, 0, -0.892));

      return player;
    }
  };

  class DemoSpawner extends entity.Component {
    static CLASS_NAME = 'DemoSpawner';

    get NAME() {
      return DemoSpawner.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn() {
      const e = new entity.Entity();
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.AddComponent(new demo_builder.DemoBuilder(this.params_));
      e.Init();

      return e;
    }
  };


  return {
    PlayerSpawner: PlayerSpawner,
    DemoSpawner: DemoSpawner,
  };
})();