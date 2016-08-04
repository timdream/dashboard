'use strict';

var App = function() {
  this.api = new API();
  this.hud = new Hud();
};

App.prototype = {
  paused: false,

  PROXIMITY_ON_WAIT: 100,
  PROXIMITY_OFF_WAIT: 30 * 1E3,
  turnedOnByProximity: false,

  start: function() {
    var pArr = [];
    pArr.push(this.api.start());
    pArr.push(this.hud.start());

    this.queue = Promise.resolve()
      .then(() => this.toggleLoading(true))
      .then(() => Promise.all(pArr))
      .then(() => {
        this.api.subscribe('hardware.sensors.onupdate',
          this.handleSensorsUpdate.bind(this));
        this.api.subscribe('hardware.buttons.onkeyup',
          this.handleButtonKeyUp.bind(this));
      })
      .then(() => this.toggleLoading(false))
      .catch((e) => this._handleError(e));
  },

  toggleLoading: function(isLoading) {
    document.body.classList.remove('init');
    document.body.classList.toggle('loading', isLoading);
  },

  handleSensorsUpdate: function(sensors) {
    if (!this.paused) {
      return;
    }

    dump('App: proximityTimer cleared.\n');
    clearTimeout(this.proximityTimer);
    if (sensors.proximity) {
      if (this.turnedOnByProximity) {
        return;
      }
      dump('App: Set proximityTimer to turn on screen brightness.');
      this.proximityTimer = setTimeout(() => {
        this.api.notify('hardware.screen.setBrightness', 1);
        this.turnedOnByProximity = true;
      }, this.PROXIMITY_ON_WAIT);
    } else {
      if (!this.turnedOnByProximity) {
        return;
      }
      dump('App: Set proximityTimer to turn off screen brightness.');
      this.proximityTimer = setTimeout(() => {
        this.api.notify('hardware.screen.setBrightness', 0);
        this.turnedOnByProximity = false;
      }, this.PROXIMITY_OFF_WAIT);
    }

  },

  handleButtonKeyUp: function(keyName) {
    switch (keyName) {
      case 'Home':

        break;

      case 'VolumeUp':

        break;

      case 'VolumeDown':

        break;

      case 'Power':
        this.paused = !this.paused;

        break;

      default:
        throw new Error('Unhandled key: ' + keyName);
    }
  },

  stop: function() {
    this.api.stop();
    this.hud.stop();
  },

  _handleError: function(e) {
    console.error(e);
    dump(e.toString + '\n');
  }
};
