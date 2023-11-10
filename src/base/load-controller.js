import {THREE, FBXLoader, GLTFLoader, SkeletonUtils} from './three-defs.js';

import * as entity from "./entity.js";
import * as shaders from '../game/render/shaders.js'


export const load_controller = (() => {

  class LoadController extends entity.Component {
    static CLASS_NAME = 'LoadController';

    get NAME() {
      return LoadController.CLASS_NAME;
    }

    constructor() {
      super();

      this.textures_ = {};
      this.models_ = {};
      this.sounds_ = {};
      this.playing_ = [];
    }

    AddModel(model, path, name) {
      const group = new THREE.Group();
      group.add(model);

      const fullName = path + name;
      this.models_[fullName] = {
        asset: { scene: group, animations: [] },
        queue: null
    };
    }

    LoadTexture(path, name) {
      if (!(name in this.textures_)) {
        const loader = new THREE.TextureLoader();
        loader.setPath(path);

        this.textures_[name] = {loader: loader, texture: loader.load(name)};
        // this.textures_[name].encoding = THREE.sRGBEncoding;
      }

      return this.textures_[name].texture;
    }

    #FinalizeLoad_(group) {
      const threejsController = this.FindEntity('threejs').GetComponent('ThreeJSController');

      group.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) {
            return;
          }

          let materials = (
              obj.material instanceof Array ?
                  obj.material : [obj.material]);

          if (obj.geometry) {
            obj.geometry.computeBoundingBox();
          }

          for (let mat of materials) {
              if (mat) {
              }
          }
      });
  }

    Load(path, name, onLoad) {
      if (name.endsWith('glb') || name.endsWith('gltf')) {
        this.LoadGLB(path, name, onLoad);
      } else if (name.endsWith('fbx')) {
        this.LoadFBX(path, name, onLoad);
      } else {
        const fullName = path + name;
        if (this.models_[fullName]) {
          const clone = this.models_[fullName].asset.scene.clone();

          this.#FinalizeLoad_(clone);
          
          onLoad({scene: clone});
          return;
        }
        // Silently fail, because screw you future me.
      }
    }

    LoadFBX(path, name, onLoad) {
      if (!(name in this.models_)) {
        const loader = new FBXLoader();
        loader.setPath(path);

        this.models_[name] = {loader: loader, asset: null, queue: [onLoad]};
        this.models_[name].loader.load(name, (fbx) => {
          this.models_[name].asset = fbx;

          const queue = this.models_[name].queue;
          this.models_[name].queue = null;
          for (let q of queue) {
            const clone = SkeletonUtils.clone(this.models_[name].asset);
            q(clone);
          }
        });
      } else if (this.models_[name].asset == null) {
        this.models_[name].queue.push(onLoad);
      } else {
        const clone = SkeletonUtils.clone(this.models_[name].asset);
        onLoad(clone);
      }
    }

    #ConvertToGameMaterial_(group) {
      const threejsController = this.FindEntity('threejs').GetComponent('ThreeJSController');

      group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) {
            return;
        }

        let materials = (
            obj.material instanceof Array ?
                obj.material : [obj.material]);

        for (let mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              // mat.metalness = 0.0;
              // obj.material = new shaders.GamePBRMaterial('TREE');
              obj.material.copy(mat);
              obj.material = new shaders.GameMaterial('PHONG');
              // obj.material = new THREE.MeshStandardMaterial();
              obj.material.map = mat.map;
              obj.material.color = mat.color;
              obj.material.normalMap = mat.normalMap;
              obj.material.vertexColors = mat.vertexColors;
              obj.material.alphaTest = mat.alphaTest;
              // obj.material.copy(mat);
            }
        }
    });
    }

    LoadGLB(path, name, onLoad) {
      const fullName = path + name;
      if (!(fullName in this.models_)) {
        const loader = new GLTFLoader();
        loader.setPath(path);

        this.models_[fullName] = {loader: loader, asset: null, queue: [onLoad]};
        this.models_[fullName].loader.load(name, (glb) => {
          this.models_[fullName].asset = glb;

          this.#ConvertToGameMaterial_(glb.scene);

          const queue = this.models_[fullName].queue;
          this.models_[fullName].queue = null;
          for (let q of queue) {
            const clone = {...glb};
            clone.scene = SkeletonUtils.clone(clone.scene);

            q(clone);
          }
        });
      } else if (this.models_[fullName].asset == null) {
        this.models_[fullName].queue.push(onLoad);
      } else {
        const clone = {...this.models_[fullName].asset};
        clone.scene = SkeletonUtils.clone(clone.scene);

        onLoad(clone);
      }
    }

    LoadSkinnedGLB(path, name, onLoad) {
      if (!(name in this.models_)) {
        const loader = new GLTFLoader();
        loader.setPath(path);

        this.models_[name] = {loader: loader, asset: null, queue: [onLoad]};
        this.models_[name].loader.load(name, (glb) => {
          this.models_[name].asset = glb;

          glb.scene.traverse(c => {
            // HAHAHAH
            c.frustumCulled = false;
            // Apparently this doesn't work, so just disable frustum culling.
            // Bugs... so many bugs...

            // if (c.geometry) {
            //   // Just make our own, super crappy, super big box
            //   c.geometry.boundingBox = new THREE.Box3(
            //       new THREE.Vector3(-50, -50, -50),
            //       new THREE.Vector3(50, 50, 50));
            //   c.geometry.boundingSphere = new THREE.Sphere();
            //   c.geometry.boundingBox.getBoundingSphere(c.geometry.boundingSphere);
            // }
          });

          const queue = this.models_[name].queue;
          this.models_[name].queue = null;
          for (let q of queue) {
            const clone = {...glb};
            clone.scene = SkeletonUtils.clone(clone.scene);

            q(clone);
          }
        });
      } else if (this.models_[name].asset == null) {
        this.models_[name].queue.push(onLoad);
      } else {
        const clone = {...this.models_[name].asset};
        clone.scene = SkeletonUtils.clone(clone.scene);

        onLoad(clone);
      }
    }

    Update(timeElapsed) {
      for (let i = 0; i < this.playing_.length; ++i) {
        if (!this.playing_[i].isPlaying) {
          this.playing_[i].parent.remove(this.playing_[i]);
        }
      }
      this.playing_ = this.playing_.filter(s => s.isPlaying);
    }
  }

  return {
      LoadController: LoadController,
  };
})();