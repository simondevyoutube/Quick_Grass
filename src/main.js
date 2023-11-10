import * as entity_manager from './base/entity-manager.js';
import * as entity from './base/entity.js';

import {load_controller} from './base/load-controller.js';
import {spawners} from './game/spawners.js';

import {threejs_component} from './base/threejs-component.js';

import * as render_sky_component from './game/render/render-sky-component.js';
import * as shaders from './game/render/shaders.js';


class QuickFPS1 {
  constructor() {
  }

  async Init() {
    await shaders.loadShaders();

    this.Initialize_();
  }

  Initialize_() {
    this.entityManager_ = entity_manager.EntityManager.Init();

    this.OnGameStarted_();
  }

  OnGameStarted_() {
    this.LoadControllers_();

    this.previousRAF_ = null;
    this.RAF_();
  }

  LoadControllers_() {
    const threejs = new entity.Entity('threejs');
    threejs.AddComponent(new threejs_component.ThreeJSController());
    threejs.Init();

    const sky = new entity.Entity();
    sky.AddComponent(new render_sky_component.RenderSkyComponent());
    sky.Init(threejs);

    // Hack
    this.camera_ = threejs.GetComponent('ThreeJSController').Camera;
    this.threejs_ = threejs.GetComponent('ThreeJSController');

    const loader = new entity.Entity('loader');
    loader.AddComponent(new load_controller.LoadController());
    loader.Init();

    const basicParams = {
      camera: this.camera_,
    };

    const spawner = new entity.Entity('spawners');
    spawner.AddComponent(new spawners.PlayerSpawner(basicParams));
    spawner.AddComponent(new spawners.DemoSpawner(basicParams));
    spawner.Init();

    spawner.GetComponent('PlayerSpawner').Spawn();
    spawner.GetComponent('DemoSpawner').Spawn();
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      } else {
        this.Step_(t - this.previousRAF_);
        this.previousRAF_ = t;
      }

      setTimeout(() => {
        this.RAF_();
      }, 1);
    });
  }

  Step_(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    this.entityManager_.Update(timeElapsedS);

    this.threejs_.Render(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', async () => {
  _APP = new QuickFPS1();
  await _APP.Init();
});
let a = 0;