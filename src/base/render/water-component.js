import {THREE} from '../three-defs.js';

import * as shaders from '../../game/render/shaders.js';

import * as entity from "../entity.js";


class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute );

		this.isFloat16BufferAttribute = true;
	}
};


const NUM_BUGS = 6;
const NUM_SEGMENTS = 2;
const NUM_VERTICES = (NUM_SEGMENTS + 1) * 2;
const BUG_SPAWN_RANGE = 40.0;
const BUG_MAX_DIST = 100.0;

const M_TMP = new THREE.Matrix4();
const AABB_TMP = new THREE.Box3();


export class WaterComponent extends entity.Component {
  static CLASS_NAME = 'WaterComponent';

  get NAME() {
    return WaterComponent.CLASS_NAME;
  }

  #params_;
  #mesh_;
  #group_;
  #totalTime_;
  #material_;
  #geometry_;

  constructor(params) {
    super();

    this.#params_ = params;
    this.#mesh_ = [];
    this.#group_ = new THREE.Group();
    this.#totalTime_ = 0;
    this.#geometry_ = null;
  }

  Destroy() {
    this.#mesh_.removeFromParent();
    this.#group_.removeFromParent();
  }

  #CreateGeometry_() {
    const plane = new THREE.PlaneGeometry(2000, 2000, 1, 1);
    plane.rotateX(-Math.PI / 2);

    return plane;
  }

  InitEntity() {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

    this.#geometry_ = this.#CreateGeometry_();
    this.#material_ = new shaders.GameMaterial('WATER');
    this.#material_.depthWrite = false;
    this.#material_.depthTest = true;
    this.#mesh_ = this.#CreateMesh_();
    this.#mesh_.position.y = -14.0;

    this.#group_.add(this.#mesh_);

    threejs.AddSceneObject(this.#group_, {pass: 'water'});
  }

  #CreateMesh_() {
    const m = new THREE.Mesh(this.#geometry_, this.#material_);
    m.receiveShadow = true;
    m.castShadow = false;
    m.visible = true;

    return m;
  }

  Update(timeElapsed) {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

    this.#totalTime_ += timeElapsed;

    this.#material_.setFloat('time', this.#totalTime_);
    this.#material_.setVec2('resolution', new THREE.Vector2(window.innerWidth, window.innerHeight));
    this.#material_.setTexture('colourTexture', threejs.WaterTexture);
    this.#material_.setMatrix('inverseProjectMatrix', threejs.Camera.projectionMatrixInverse);
  }
}