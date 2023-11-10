import * as entity from './entity.js';
import * as passes from "./passes.js";


const ROOT_ = '__root__';

export class EntityManager {
  static #instance_ = null;

  #root_;
  #entitiesMap_;

  static Init() {
    this.#instance_ = new EntityManager();
    this.#instance_.#CreateRoot_();
    return this.#instance_;
  }

  static get Instance() {
    return this.#instance_;
  }

  constructor() {
    this.#entitiesMap_ = {};
    this.#root_ = null;
  }

  #CreateRoot_() {
    this.#root_ = new entity.Entity(ROOT_);
    this.#root_.Init();
  }

  Remove(n) {
    delete this.#entitiesMap_[n];
  }

  Get(n) {
    return this.#entitiesMap_[n];
  }

  Add(child, parent) {
    this.#entitiesMap_[child.Name] = child;

    // Root check
    if (child.ID == this.#root_.ID) {
      parent = null;
    } else {
      parent = parent ? parent : this.#root_;
    }

    child.SetParent(parent);
  }

  Update(timeElapsed) {
    for (let i = passes.Passes.PASSES_MIN; i <= passes.Passes.PASSES_MAX; i = i << 1) {
      this.UpdatePass_(timeElapsed, i);
    }
  }

  UpdatePass_(timeElapsedS, pass) {
    this.#root_.Update(timeElapsedS, pass);
  }
}
