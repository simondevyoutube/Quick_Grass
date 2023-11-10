import * as entity from "../base/entity.js";
import * as passes from '../base/passes.js';


export const player_input = (() => {

  const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'SPACE': 32,
    'SHIFT_L': 16,
    'CTRL_L': 17,
    'BACKSPACE': 8,
  };

  class PlayerInput extends entity.Component {
    static CLASS_NAME = 'PlayerInput';

    get NAME() {
      return PlayerInput.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
    }
  
    InitEntity() {
      this.current_ = {
        leftButton: false,
        rightButton: false,
        mouseXDelta: 0,
        mouseYDelta: 0,
        mouseX: 0,
        mouseY: 0,
      };
      this.previous_ = null;
      this.keys_ = {};
      this.previousKeys_ = {};
      this.target_ = document;
      this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
      this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
      this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
      this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
      this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);

      this.Parent.Attributes.Input = {
        Keyboard: {
          Current: this.keys_,
          Previous: this.previousKeys_
        },
        Mouse: {
          Current: this.current_,
          Previous: this.previous_
        },
      };

      this.SetPass(passes.Passes.INPUT);
    }
  
    onMouseMove_(e) {
      this.current_.mouseX = e.pageX - window.innerWidth / 2;
      this.current_.mouseY = e.pageY - window.innerHeight / 2;

      if (this.previous_ === null) {
        this.previous_ = {...this.current_};
      }

      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    }

    onMouseDown_(e) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          this.current_.leftButton = true;
          break;
        }
        case 2: {
          this.current_.rightButton = true;
          break;
        }
      }
    }

    onMouseUp_(e) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          this.current_.leftButton = false;
          break;
        }
        case 2: {
          this.current_.rightButton = false;
          break;
        }
      }
    }

    onKeyDown_(e) {
      this.keys_[e.keyCode] = true;
    }

    onKeyUp_(e) {
      this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
      return !!this.keys_[keyCode];
    }

    mouseLeftReleased(checkPrevious=true) {
      return (!this.current_.leftButton && this.previous_.leftButton);
    }

    isReady() {
      return this.previous_ !== null;
    }

    Update(_) {
      if (this.previous_ !== null) {
        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

        this.previous_ = {...this.current_};
        this.previousKeys_ = {...this.keys_};
      }
    }
  };

  return {
    PlayerInput: PlayerInput,
    KEYS: KEYS,
  };

})();