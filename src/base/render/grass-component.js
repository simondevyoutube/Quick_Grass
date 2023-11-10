import {THREE} from '../three-defs.js';

import * as shaders from '../../game/render/shaders.js';

import * as entity from "../entity.js";

import * as terrain_component from './terrain-component.js';
import * as math from '../math.js';



class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute );

		this.isFloat16BufferAttribute = true;
	}
};

const M_TMP = new THREE.Matrix4();
const S_TMP = new THREE.Sphere();
const AABB_TMP = new THREE.Box3();


const NUM_GRASS = (32 * 32) * 3;
const GRASS_SEGMENTS_LOW = 1;
const GRASS_SEGMENTS_HIGH = 6;
const GRASS_VERTICES_LOW = (GRASS_SEGMENTS_LOW + 1) * 2;
const GRASS_VERTICES_HIGH = (GRASS_SEGMENTS_HIGH + 1) * 2;
const GRASS_LOD_DIST = 15;
const GRASS_MAX_DIST = 100;

const GRASS_PATCH_SIZE = 5 * 2;

const GRASS_WIDTH = 0.1;
const GRASS_HEIGHT = 1.5;



export class GrassComponent extends entity.Component {
  static CLASS_NAME = 'GrassComponent';

  get NAME() {
    return GrassComponent.CLASS_NAME;
  }

  #params_;
  #meshesLow_;
  #meshesHigh_;
  #group_;
  #totalTime_;
  #grassMaterialLow_;
  #grassMaterialHigh_;
  #geometryLow_;
  #geometryHigh_;

  constructor(params) {
    super();

    this.#params_ = params;
    this.#meshesLow_ = [];
    this.#meshesHigh_ = [];
    this.#group_ = new THREE.Group();
    this.#group_.name = "GRASS";
    this.#totalTime_ = 0;
    this.#grassMaterialLow_ = null;
    this.#grassMaterialHigh_ = null;
    this.#geometryLow_ = null;
    this.#geometryHigh_ = null;
  }

  Destroy() {
    for (let m of this.#meshesLow_) {
      m.removeFromParent();
    }
    for (let m of this.#meshesHigh_) {
      m.removeFromParent();
    }
    this.#group_.removeFromParent();
  }

  #CreateGeometry_(segments) {
    math.set_seed(0);

    const VERTICES = (segments + 1) * 2;

    const indices = [];
    for (let i = 0; i < segments; ++i) {
      const vi = i * 2;
      indices[i*12+0] = vi + 0;
      indices[i*12+1] = vi + 1;
      indices[i*12+2] = vi + 2;

      indices[i*12+3] = vi + 2;
      indices[i*12+4] = vi + 1;
      indices[i*12+5] = vi + 3;

      const fi = VERTICES + vi;
      indices[i*12+6] = fi + 2;
      indices[i*12+7] = fi + 1;
      indices[i*12+8] = fi + 0;

      indices[i*12+9]  = fi + 3;
      indices[i*12+10] = fi + 1;
      indices[i*12+11] = fi + 2;
    }

    const offsets = [];
    for (let i = 0; i < NUM_GRASS; ++i) {
      offsets.push(math.rand_range(-GRASS_PATCH_SIZE * 0.5, GRASS_PATCH_SIZE * 0.5));
      offsets.push(math.rand_range(-GRASS_PATCH_SIZE * 0.5, GRASS_PATCH_SIZE * 0.5));
      offsets.push(0);
    }

    const offsetsData = offsets.map(THREE.DataUtils.toHalfFloat);

    const vertID = new Uint8Array(VERTICES*2);
    for (let i = 0; i < VERTICES*2; ++i) {
      vertID[i] = i;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = NUM_GRASS;
    geo.setAttribute('vertIndex', new THREE.Uint8BufferAttribute(vertID, 1));
    geo.setAttribute('position', new InstancedFloat16BufferAttribute(offsetsData, 3));
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1 + GRASS_PATCH_SIZE * 2);

    return geo;
  }

  InitEntity() {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

    this.#grassMaterialLow_ = new shaders.GameMaterial('GRASS');
    this.#grassMaterialHigh_ = new shaders.GameMaterial('GRASS');
    this.#grassMaterialLow_.side = THREE.FrontSide;
    this.#grassMaterialHigh_.side = THREE.FrontSide;

    this.#geometryLow_ = this.#CreateGeometry_(GRASS_SEGMENTS_LOW);
    this.#geometryHigh_ = this.#CreateGeometry_(GRASS_SEGMENTS_HIGH);

    this.#grassMaterialLow_.setVec2('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT));
    this.#grassMaterialLow_.setVec4('grassParams', new THREE.Vector4(
        GRASS_SEGMENTS_LOW, GRASS_VERTICES_LOW, this.#params_.height, this.#params_.offset));
    this.#grassMaterialLow_.setVec4('grassDraw', new THREE.Vector4(
        GRASS_LOD_DIST, GRASS_MAX_DIST, 0, 0));
    this.#grassMaterialLow_.setTexture('heightmap', this.#params_.heightmap);
    this.#grassMaterialLow_.setVec4('heightParams', new THREE.Vector4(this.#params_.dims, 0, 0, 0))
    this.#grassMaterialLow_.setVec3('grassLODColour', new THREE.Vector3(0, 0, 1));
    this.#grassMaterialLow_.alphaTest = 0.5;

    this.#grassMaterialHigh_.setVec2('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT));
    this.#grassMaterialHigh_.setVec4('grassParams', new THREE.Vector4(
        GRASS_SEGMENTS_HIGH, GRASS_VERTICES_HIGH, this.#params_.height, this.#params_.offset));
    this.#grassMaterialHigh_.setVec4('grassDraw', new THREE.Vector4(
        GRASS_LOD_DIST, GRASS_MAX_DIST, 0, 0));
    this.#grassMaterialHigh_.setTexture('heightmap', this.#params_.heightmap);
    this.#grassMaterialHigh_.setVec4('heightParams', new THREE.Vector4(this.#params_.dims, 0, 0, 0))
    this.#grassMaterialHigh_.setVec3('grassLODColour', new THREE.Vector3(1, 0, 0));
    this.#grassMaterialHigh_.alphaTest = 0.5;

    threejs.AddSceneObject(this.#group_);
  }

  #CreateMesh_(distToCell) {
    const meshes = distToCell > GRASS_LOD_DIST ? this.#meshesLow_ : this.#meshesHigh_;
    if (meshes.length > 1000) {
      console.log('crap')
      return null;
    }

    const geo = distToCell > GRASS_LOD_DIST ? this.#geometryLow_ : this.#geometryHigh_;
    const mat = distToCell > GRASS_LOD_DIST ? this.#grassMaterialLow_ : this.#grassMaterialHigh_;

    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, 0, 0);
    m.receiveShadow = true;
    m.castShadow = false;
    m.visible = false;

    meshes.push(m);
    this.#group_.add(m);
    return m;
  }

  Update(timeElapsed) {
    this.#totalTime_ += timeElapsed;

    this.#grassMaterialLow_.setFloat('time', this.#totalTime_);
    this.#grassMaterialHigh_.setFloat('time', this.#totalTime_);

    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
    const camera = threejs.Camera;
    const frustum = new THREE.Frustum().setFromProjectionMatrix(M_TMP.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse));

    const meshesLow = [...this.#meshesLow_];
    const meshesHigh = [...this.#meshesHigh_];

    const baseCellPos = camera.position.clone();
    baseCellPos.divideScalar(GRASS_PATCH_SIZE);
    baseCellPos.floor();
    baseCellPos.multiplyScalar(GRASS_PATCH_SIZE);

    // This is dumb and slow
    for (let c of this.#group_.children) {
      c.visible = false;
    }

    const terrain = this.#params_.terrain.GetComponent(terrain_component.TerrainComponent.CLASS_NAME);

    const cameraPosXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z);
    const playerPos = this.FindEntity('player').Position;

    this.#grassMaterialHigh_.setVec3('playerPos', playerPos);
    // this.#grassMaterialHigh_.setVec3('cameraPos', camera.position);
    this.#grassMaterialHigh_.setMatrix('viewMatrixInverse', camera.matrixWorld);
    this.#grassMaterialLow_.setMatrix('viewMatrixInverse', camera.matrixWorld);
    // this.#grassMaterialLow_.setVec3('cameraPos', camera.position);


    // const playerCellPos = this.FindEntity('player').Position.clone();
    // playerCellPos.divideScalar(GRASS_PATCH_SIZE);
    // playerCellPos.round();
    // playerCellPos.multiplyScalar(GRASS_PATCH_SIZE);
    // const playerCellPos = new THREE.Vector3();

    // const m = meshesHigh.length > 0 ? meshesHigh.pop() : this.#CreateMesh_(0);
    // m.position.copy(playerCellPos);
    // m.position.y = 0;
    // m.visible = true;

    let totalGrass = 0;
    let totalVerts = 0;

    for (let x = -16; x < 16; x++) {
      for (let z = -16; z < 16; z++) {
        // Current cell
        const currentCell = new THREE.Vector3(
            baseCellPos.x + x * GRASS_PATCH_SIZE, 0, baseCellPos.z + z * GRASS_PATCH_SIZE);
        currentCell.y = terrain.GetHeight(currentCell.x, currentCell.z);

        AABB_TMP.setFromCenterAndSize(currentCell, new THREE.Vector3(GRASS_PATCH_SIZE, 1000, GRASS_PATCH_SIZE));
        const distToCell = AABB_TMP.distanceToPoint(cameraPosXZ);
        if (distToCell > GRASS_MAX_DIST) {
          continue;
        }

        if (x == 0 && z == 0) {
          let a = 0;
        }

        if (!frustum.intersectsBox(AABB_TMP)) {
          continue;
        }

        if (distToCell > GRASS_LOD_DIST) {
          const m = meshesLow.length > 0 ? meshesLow.pop() : this.#CreateMesh_(distToCell);
          m.position.copy(currentCell);
          m.position.y = 0;
          m.visible = true;
          totalVerts += GRASS_VERTICES_LOW;
        } else {
          const m = meshesHigh.length > 0 ? meshesHigh.pop() : this.#CreateMesh_(distToCell);
          m.position.copy(currentCell);
          m.position.y = 0;
          m.visible = true;
          totalVerts += GRASS_VERTICES_HIGH;
        }
        totalGrass += 1;
      }
    }

    totalGrass *= NUM_GRASS;
    totalVerts *= NUM_GRASS;
    // console.log('total grass: ' + totalGrass + ' total verts: ' + totalVerts);
  }
}