import {THREE} from './three-defs.js';

import * as entity_manager from './entity-manager.js';
import * as passes from './passes.js';


const SCALE_1_ = new THREE.Vector3(1, 1, 1);

let IDS_ = 0;

export class Entity {
  constructor(name) {
    IDS_ += 1;

    this.id_ = IDS_;
    this.name_ = name ? name : this.GenerateName_();
    this.components_ = {};
    this.attributes_ = {};

    this.transform_ = new THREE.Matrix4();
    this.transform_.identity();
    this.worldTransform_ = new THREE.Matrix4();
    this.worldTransform_.identity();

    this.position_ = new THREE.Vector3();
    this.rotation_ = new THREE.Quaternion();

    this.handlers_ = {};
    this.parent_ = null;
    this.dead_ = false;
    this.active_ = true;

    this.childrenActive_ = [];
    this.children_ = [];
  }

  Destroy_() {
    for (let c of this.children_) {
      c.Destroy_();
    }
    for (let k in this.components_) {
      this.components_[k].Destroy();
    }
    this.childrenActive_ = [];
    this.children_ = [];
    this.components_ = {};
    this.parent_ = null;
    this.handlers_ = {};
    this.Manager.Remove(this.name_);
  }

  GenerateName_() {
    return '__name__' + this.id_;
  }

  RegisterHandler_(n, h) {
    if (!(n in this.handlers_)) {
      this.handlers_[n] = [];
    }
    this.handlers_[n].push(h);
  }

  UnregisterHandler_(n, h) {
    this.handlers_[n] = this.handlers_[n].filter(c => c != h);
  }

  AddChild_(e) {
    this.children_.push(e);
    this.RefreshActiveChildren_();
  }

  RemoveChild_(e) {
    this.children_ = this.children_.filter(c => c != e);
    this.RefreshActiveChildren_();
  }

  SetParent(p) {
    if (this.parent_) {
      this.parent_.RemoveChild_(this);
    }

    this.parent_ = p;

    if (this.parent_) {
      this.parent_.AddChild_(this);
    }
  }

  get Name() {
    return this.name_;
  }

  get ID() {
    return this.id_;
  }

  get Manager() {
    return entity_manager.EntityManager.Instance;
  }

  get Parent() {
    return this.parent_;
  }

  get Attributes() {
    return this.attributes_;
  }

  get Children() {
    return [...this.children_];
  }

  get IsDead() {
    return this.dead_;
  }

  get IsActive() {
    return this.active_;
  }

  RefreshActiveChildren_() {
    this.childrenActive_ = this.children_.filter(c => c.IsActive);
  }

  SetActive(active) {
    this.active_ = active;
    if (this.parent_) {
      this.parent_.RefreshActiveChildren_();
    }
  }

  SetDead() {
    this.dead_ = true;
  }

  AddComponent(c) {
    c.SetParent(this);
    this.components_[c.NAME] = c;

    c.InitComponent();
  }

  Init(parent) {
    this.Manager.Add(this, parent);
    this.InitEntity_();
  }

  InitEntity_() {
    for (let k in this.components_) {
      this.components_[k].InitEntity();
    }
    this.SetActive(this.active_);
  }

  GetComponent(n) {
    return this.components_[n];
  }

  FindEntity(name) {
    return this.Manager.Get(name);
  }

  FindChild(name, recursive) {
    let result = null;

    for (let i = 0, n = this.children_.length; i < n; ++i) {
      if (this.children_[i].Name == name) {
        result = this.children_[i];
        break;
      }

      if (recursive) {
        result = this.children_[i].FindChild(name, recursive);
        if (result) {
          break;
        }
      }
    }
    return result;
  }

  Broadcast(msg) {
    if (this.IsDead) {
      return;
    }
    if (!(msg.topic in this.handlers_)) {
      return;
    }

    for (let curHandler of this.handlers_[msg.topic]) {
      curHandler(msg);
    }
  }

  SetPosition(p) {
    this.position_.copy(p);
    this.transform_.compose(this.position_, this.rotation_, SCALE_1_);
    this.Broadcast({
      topic: 'update.position',
      value: this.position_,
    });
  }

  SetQuaternion(r) {
    this.rotation_.copy(r);
    this.transform_.compose(this.position_, this.rotation_, SCALE_1_);
    this.Broadcast({
      topic: 'update.rotation',
      value: this.rotation_,
    });
  }

  get Transform() {
    return this.transform_;
  }

  get WorldTransform() {
    const m = this.worldTransform_.copy(this.transform_);
    if (this.parent_) {
      m.multiply(this.parent_.Transform);
    }
    return m;
  }

  GetWorldPosition(target) {
    target.setFromMatrixPosition(this.WorldTransform);
    return target;
  }

  get Position() {
    return this.position_;
  }

  get Quaternion() {
    return this.rotation_;
  }

  get Forward() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation_);
    return forward;
  }

  get Left() {
    const forward = new THREE.Vector3(-1, 0, 0);
    forward.applyQuaternion(this.rotation_);
    return forward;
  }

  get Up() {
    const forward = new THREE.Vector3(0, 1, 0);
    forward.applyQuaternion(this.rotation_);
    return forward;
  }

  UpdateComponents_(timeElapsed, pass) {
    for (let k in this.components_) {
      const c = this.components_[k];
      if (c.Pass == pass) {
        c.Update(timeElapsed);
      }
    }
  }

  UpdateChildren_(timeElapsed, pass) {
    const dead = [];
    const alive = [];
    for (let i = 0; i < this.childrenActive_.length; ++i) {
      const e = this.childrenActive_[i];

      e.Update(timeElapsed, pass);

      if (e.IsDead) {
        dead.push(e);
      } else {
        alive.push(e);
      }
    }

    let hasDead = false;
    for (let i = 0; i < dead.length; ++i) {
      const e = dead[i];

      e.Destroy_();
      hasDead = true;
    }

    if (hasDead) {
      this.children_ = this.children_.filter(c => !c.IsDead);
      this.RefreshActiveChildren_();
    }
  }

  Update(timeElapsed, pass) {
    this.UpdateComponents_(timeElapsed, pass);
    this.UpdateChildren_(timeElapsed, pass);
  }
};


export class Component {
  get NAME() {
    console.error('Unnamed Component: ' + this.constructor.name);
    return '__UNNAMED__';
  }

  constructor() {
    this.parent_ = null;
    this.pass_ = passes.Passes.DEFAULT;
  }

  Destroy() {}
  InitComponent() {}
  InitEntity() {}
  Update(timeElapsed) {}

  SetParent(parent) {
    this.parent_ = parent;
  }

  SetPass(pass) {
      this.pass_ = pass;
  }

  get Pass() {
    return this.pass_;
  }

  GetComponent(name) {
    return this.parent_.GetComponent(name);
  }

  get Manager() {
    return this.Parent.Manager;
  }

  get Parent() {
    return this.parent_;
  }

  FindEntity(name) {
    return this.Manager.Get(name);
  }

  Broadcast(m) {
    this.parent_.Broadcast(m);
  }

  RegisterHandler_(name, cb) {
    this.parent_.RegisterHandler_(name, cb);
  }
};
