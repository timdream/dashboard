'use strict';

var ScreenTimer = function() {
};

ScreenTimer.prototype = {
  TIME_TO_OFF: 30 * 1E3,

  onbrightnesschange: null,
  isBrightnessOn: true,

  setScheduledScreenWake: function() {
    setInterval(() => {
      // Every half-hour
      if ((Math.floor(Date.now() / 1000) % 1800) === 0) {
        dump('ScreenTimer: turned screen brightness on\n');
        navigator.vibrate(10);
        this.wake();
        this.countToScreenOff();
      }
    }, 1000);
  },

  wake: function() {
    if (this.isBrightnessOn) {
      return;
    }
    this.isBrightnessOn = true;
    this.onbrightnesschange(1);
  },

  countToScreenOff: function() {
    if (!this.isBrightnessOn) {
      return;
    }
    clearTimeout(this.offTimer);
    this.offTimer = this.setTimeout(() => {
      this.isBrightnessOn = false;
      this.onbrightnesschange(0);
    }, this.TIME_TO_OFF);
  }
};

var App = function() {
  this.api = new API();
  this.hud = new Hud();
};

App.prototype = {
  paused: false,

  PROXIMITY_ON_WAIT: 100,
  proximityTimerId: undefined,

  start: function() {
    var pArr = [];
    pArr.push(this.api.start());
    pArr.push(this.hud.start());

    this.screenTimer = new ScreenTimer();
    this.screenTimer.onbrightnesschange = (brightness) => {
      this.api.notify('hardware.screen.setBrightness', brightness);
    };

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
      .then(() => this.screenTimer.countToScreenOff())
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

    if (sensors.proximity) {
      dump('App: Set proximityTimerId to turn on screen brightness.');
      this.proximityTimerId = setTimeout(() => {
        this.screenTimer.wake();
        this.proximityTimerId = undefined;
      }, this.PROXIMITY_ON_WAIT);
    } else if (this.proximityTimerId !== undefined) {
      dump('App: proximityTimerId cleared.\n');
      clearTimeout(this.proximityTimerId);
      this.proximityTimerId = undefined;
    } else {
      dump('App: Set screenTimer to turn off screen brightness.');
      this.screenTimer.countToScreenOff();
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
