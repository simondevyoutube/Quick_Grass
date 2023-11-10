import {THREE, Float32ToFloat16} from '../three-defs.js';

import * as shaders from '../../game/render/shaders.js';

import * as entity from "../entity.js";
import * as math from '../math.js';

import { render_component } from '../render-component.js';
import * as grass_component from './grass-component.js';
import * as bugs_component from './bugs-component.js';
import * as wind_component from './wind-component.js';
import * as water_component from './water-component.js';


function GetImageData_(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext( '2d' );
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

class Heightmap {
  constructor(params, img) {
    this.params_ = params;
    this.data_ = GetImageData_(img);
  }

  Get(x, y) {
    const _GetPixelAsFloat = (x, y) => {
      const position = (x + this.data_.width * y) * 4;
      const data = this.data_.data;
      return data[position] / 255.0;
    }

    // Bilinear filter
    const offset = this.params_.offset;
    const dimensions = this.params_.dimensions;

    const xf = math.sat((x - offset.x) / dimensions.x);
    const yf = 1.0 - math.sat((y - offset.y) / dimensions.y);
    const w = this.data_.width - 1;
    const h = this.data_.height - 1;

    const x1 = Math.floor(xf * w);
    const y1 = Math.floor(yf * h);
    const x2 = math.clamp(x1 + 1, 0, w);
    const y2 = math.clamp(y1 + 1, 0, h);

    const xp = xf * w - x1;
    const yp = yf * h - y1;

    const p11 = _GetPixelAsFloat(x1, y1);
    const p21 = _GetPixelAsFloat(x2, y1);
    const p12 = _GetPixelAsFloat(x1, y2);
    const p22 = _GetPixelAsFloat(x2, y2);

    const px1 = math.lerp(xp, p11, p21);
    const px2 = math.lerp(xp, p12, p22);

    return math.lerp(yp, px1, px2) * this.params_.height;
  }
}


const TERRAIN_HEIGHT = 75;
const TERRAIN_OFFSET = 50;

// const TERRAIN_HEIGHT = 0;
// const TERRAIN_OFFSET = 0;

const TERRAIN_DIMS = 2000;

export class TerrainComponent extends entity.Component {
  static CLASS_NAME = 'TerrainComponent';

  get NAME() {
    return TerrainComponent.CLASS_NAME;
  }

  #params_;
  #heightmap_;
  #mesh_;

  constructor(params) {
    super();

    this.#params_ = params;
    this.#heightmap_ = null;
    this.#mesh_ = null;
  }

  Destroy() {
    this.#mesh_.removeFromParent();
  }

  GetHeight(x, y) {
    const xn = (x + TERRAIN_DIMS * 0.5) / TERRAIN_DIMS;
    const yn = 1 - (y + TERRAIN_DIMS * 0.5) / TERRAIN_DIMS;
    return this.#heightmap_.Get(xn, yn) - TERRAIN_OFFSET;
  }

  IsReady() {
    return this.#heightmap_ != null;
  }

  InitEntity() {
    const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
    const geometry = new THREE.PlaneGeometry(TERRAIN_DIMS, TERRAIN_DIMS, 256, 256);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        './textures/' + 'terrain.png',
        (heightmapTexture) => {
      const heightmapGenerator = new Heightmap({
          dimensions: new THREE.Vector2(1.0, 1.0),
          offset: new THREE.Vector2(0.0, 0.0),
          height: TERRAIN_HEIGHT
        }, heightmapTexture.image);

      this.#heightmap_ = heightmapGenerator;

      const positions = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) {
        const h = heightmapGenerator.Get(uv.array[i*2+0], uv.array[i*2+1]) - TERRAIN_OFFSET;
        positions.array[i*3+2] = h;
      }

      geometry.computeVertexNormals();
      geometry.computeTangents();

      const position16 = Float32ToFloat16(geometry.attributes.position.array);
      const normal16 = Float32ToFloat16(geometry.attributes.normal.array);
      const tangent16 = Float32ToFloat16(geometry.attributes.tangent.array);
      const uv16 = Float32ToFloat16(geometry.attributes.uv.array);

      geometry.setAttribute('position', new THREE.Float16BufferAttribute(position16, 3));
      geometry.setAttribute('normal', new THREE.Float16BufferAttribute(normal16, 3));
      geometry.setAttribute('tangent', new THREE.Float16BufferAttribute(tangent16, 3));
      geometry.setAttribute('uv', new THREE.Float16BufferAttribute(uv16, 2));
      geometry.rotateX(-Math.PI / 2);

      heightmapTexture.colorSpace = THREE.LinearSRGBColorSpace;

      const LOAD_ = (name) => {
        const albedo = textureLoader.load('./textures/' + name);
        albedo.magFilter = THREE.LinearFilter;
        albedo.minFilter = THREE.LinearMipMapLinearFilter;
        albedo.wrapS = THREE.RepeatWrapping;
        albedo.wrapT = THREE.RepeatWrapping;
        albedo.anisotropy = 16;
        albedo.repeat.set(40, 40);
        return albedo; 
      }

      // const grassAlbedo = LOAD_('wispy-grass-meadow_albedo.png');
      const grid = LOAD_('grid.png');
      grid.anisotropy = 16;
      grid.repeat.set(1, 1);

      const terrainMaterial = new shaders.GamePBRMaterial('TERRAIN', {});
      terrainMaterial.setTexture('heightmap', heightmapTexture);
      terrainMaterial.setTexture('grid', grid);
      terrainMaterial.setVec4('heightParams', new THREE.Vector4(TERRAIN_DIMS, TERRAIN_DIMS, TERRAIN_HEIGHT, TERRAIN_OFFSET));

      this.#mesh_ = new THREE.Mesh(geometry, terrainMaterial);
      this.#mesh_.position.set(0, 0, 0);
      this.#mesh_.receiveShadow = true;
      this.#mesh_.castShadow = false;
  
      threejs.AddSceneObject(this.#mesh_);
  
      this.Broadcast({
        topic: 'render.loaded',
        value: this.#mesh_,
      });

      
      const mountain = new entity.Entity();
      mountain.AddComponent(new render_component.RenderComponent({
        resourcePath: './models/',
        resourceName: 'mountain.glb',
        scale: new THREE.Vector3(1, 1, 1),
        emissive: new THREE.Color(0x000000),
        color: new THREE.Color(0xFFFFFF),
        receiveShadow: false,
        castShadow: false,
      }));

      mountain.SetPosition(new THREE.Vector3(0, -100, 0));
      mountain.SetActive(false);
      mountain.Init();

      const water = new entity.Entity();
      water.AddComponent(new water_component.WaterComponent({
        terrain: this.Parent,
        height: TERRAIN_HEIGHT,
        offset: TERRAIN_OFFSET,
        heightmap: heightmapTexture
      }));
      water.SetActive(true);
      water.Init(this.Parent);

      const grass = new entity.Entity();
      grass.AddComponent(new grass_component.GrassComponent({
        terrain: this.Parent,
        height: TERRAIN_HEIGHT,
        offset: TERRAIN_OFFSET,
        dims: TERRAIN_DIMS,
        heightmap: heightmapTexture
      }));
      grass.SetActive(true);
      grass.Init(this.Parent);

      const bugs = new entity.Entity();
      bugs.AddComponent(new bugs_component.BugsComponent({
        terrain: this.Parent,
        height: TERRAIN_HEIGHT,
        offset: TERRAIN_OFFSET,
        dims: TERRAIN_DIMS,
        heightmap: heightmapTexture
      }));
      bugs.SetActive(true);
      bugs.Init(this.Parent);

      const wind = new entity.Entity();
      wind.AddComponent(new wind_component.WindComponent({
        terrain: this.Parent,
        height: TERRAIN_HEIGHT,
        offset: TERRAIN_OFFSET,
        dims: TERRAIN_DIMS,
        heightmap: heightmapTexture
      }));
      wind.SetActive(true);
      wind.Init(this.Parent);
    });
  }

  Update(timeElapsed) {
  }
}