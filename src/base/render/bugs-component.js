import {THREE} from '../three-defs.js';

import * as shaders from '../../game/render/shaders.js';

import * as entity from "../entity.js";

import * as terrain_component from './terrain-component.js';
import MersenneTwister from 'mersenne-twister';


class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute );

		this.isFloat16BufferAttribute = true;
	}
};


const NUM_BUGS = 8;
const NUM_SEGMENTS = 2;
const NUM_VERTICES = (NUM_SEGMENTS + 1) * 2;
const BUG_SPAWN_RANGE = 40.0;
const BUG_MAX_DIST = 100.0;

const M_TMP = new THREE.Matrix4();
const AABB_TMP = new THREE.Box3();


export class BugsComponent extends entity.Component {
  static CLASS_NAME = 'BugsComponent';

  get NAME() {
    return BugsComponent.CLASS_NAME;
  }

  #params_;
  #meshes_;
  #group_;
  #totalTime_;
  #material_;
  #geometry_;

  constructor(params) {
    super();

    this.#params_ = params;
    this.#meshes_ = [];
    this.#group_ = new THREE.Group();
    this.#totalTime_ = 0;
    this.#geometry_ = null;
  }

  Destroy() {
    for (let m of this.#meshes_) {
      m.removeFromParent();
    }
    this.#group_.removeFromParent();
  }

  #CreateGeometry_() {
    const rng = new MersenneTwister(1);

    const offsets = new Uint16Array(NUM_BUGS * 3);
    for (let i = 0; i < NUM_BUGS; ++i) {
      offsets[i*3 + 0] = THREE.DataUtils.toHalfFloat((rng.random() * 2.0 - 1.0) * (BUG_SPAWN_RANGE / 2));
      offsets[i*3 + 1] = THREE.DataUtils.toHalfFloat(rng.random() * 1.0 + 2.0);
      offsets[i*3 + 2] = THREE.DataUtils.toHalfFloat((rng.random() * 2.0 - 1.0) * (BUG_SPAWN_RANGE / 2));
    }

    const plane = new THREE.PlaneGeometry(1, 1, 2, 1);

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = NUM_BUGS;
    geo.setAttribute('position', plane.attributes.position);
    geo.setAttribute('uv', plane.attributes.uv);
    geo.setAttribute('normal', plane.attributes.normal);
    geo.setAttribute('offset', new InstancedFloat16BufferAttribute(offsets, 3));
    geo.setIndex(plane.index);
    geo.rotateX(-Math.PI / 2);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), BUG_SPAWN_RANGE);

    return geo;
  }

  InitEntity() {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

    this.#geometry_ = this.#CreateGeometry_();

    const textureLoader = new THREE.TextureLoader();
    const albedo = textureLoader.load('./textures/' + 'moth.png');
    albedo.colorSpace = THREE.SRGBColorSpace;

    // // this.#grassMaterialLow_.setVec4('grassDraw', new THREE.Vector4(
    // //     GRASS_LOD_DIST, GRASS_MAX_DIST, 0, 0));
    this.#material_ = new shaders.GameMaterial('BUGS');
    this.#material_.setVec2('bugsSize', new THREE.Vector2(0.5, 1.25));
    this.#material_.setVec4('bugsParams', new THREE.Vector4(
        NUM_SEGMENTS, NUM_VERTICES, 0, 0));
    this.#material_.setTexture('heightmap', this.#params_.heightmap);
    this.#material_.setVec3('heightmapParams', new THREE.Vector3(
        this.#params_.height, this.#params_.offset, this.#params_.dims));
    this.#material_.map = albedo;
    this.#material_.shininess = 0;
    this.#material_.alphaTest = 0.5;
    this.#material_.side = THREE.DoubleSide;

    threejs.AddSceneObject(this.#group_);
  }

  #CreateMesh_() {
    const m = new THREE.Mesh(this.#geometry_, this.#material_);
    m.receiveShadow = true;
    m.castShadow = false;
    m.visible = true;

    this.#meshes_.push(m);
    this.#group_.add(m);

    return m;
  }

  Update(timeElapsed) {
    this.#totalTime_ += timeElapsed;

    this.#material_.setFloat('time', this.#totalTime_);

    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
    const camera = threejs.Camera;
    const frustum = new THREE.Frustum().setFromProjectionMatrix(M_TMP.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse));

    const meshes = [...this.#meshes_];

    const baseCellPos = camera.position.clone();
    baseCellPos.divideScalar(BUG_SPAWN_RANGE);
    baseCellPos.floor();
    baseCellPos.multiplyScalar(BUG_SPAWN_RANGE);

    // This is dumb and slow
    for (let c of this.#group_.children) {
      c.visible = false;
    }

    const terrain = this.#params_.terrain.GetComponent(terrain_component.TerrainComponent.CLASS_NAME);

    const cameraPosXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z);

    for (let x = -3; x < 3; x++) {
      for (let z = -3; z < 3; z++) {
        // Current cell
        const currentCell = new THREE.Vector3(
            baseCellPos.x + x * BUG_SPAWN_RANGE, 0, baseCellPos.z + z * BUG_SPAWN_RANGE);
        currentCell.y = terrain.GetHeight(currentCell.x, currentCell.z);

        AABB_TMP.setFromCenterAndSize(currentCell, new THREE.Vector3(BUG_SPAWN_RANGE, 100, BUG_SPAWN_RANGE));
        const distToCell = AABB_TMP.distanceToPoint(cameraPosXZ);
        if (distToCell > BUG_MAX_DIST) {
          continue;
        }

        if (!frustum.intersectsBox(AABB_TMP)) {
          continue;
        }

        const m = meshes.length > 0 ? meshes.pop() : this.#CreateMesh_();
        m.position.copy(currentCell);
        m.position.y = 0;
        m.visible = true;
      }
    }
  }
}