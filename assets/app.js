'use strict';

var PauseTimer = function() {
};

PauseTimer.prototype = {
  TIME_TO_OFF: 30 * 1E3,

  onpaused: null,
  paused: false,

  setScheduledUnPause: function() {
    setInterval(() => {
      // Every half-hour
      if ((Math.floor(Date.now() / 1000) % 1800) === 0) {
        dump('PauseTimer: turned screen on\n');
        navigator.vibrate(10);
        this.wake();
        this.countToPause();
      }
    }, 1000);
  },

  wake: function() {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.onpaused(false);
  },

  countToPause: function() {
    if (this.paused) {
      return;
    }
    clearTimeout(this.offTimer);
    this.offTimer = setTimeout(() => {
      this.paused = true;
      this.onpaused(true);
    }, this.TIME_TO_OFF);
  },

  togglePaused: function() {
    this.paused = !this.paused;
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

    this.pauseTimer = new PauseTimer();
    this.pauseTimer.onpaused = (paused) => {
      this.api.notify('setPaused', paused);
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
      .then(() => this.pauseTimer.countToPause())
      .then(() => this.pauseTimer.setScheduledUnPause())
      .catch((e) => this._handleError(e));
  },

  toggleLoading: function(isLoading) {
    document.body.classList.remove('init');
    document.body.classList.toggle('loading', isLoading);
  },

  handleSensorsUpdate: function(sensors) {
    if (sensors.proximity) {
      dump('App: Set proximityTimerId to turn on screen.');
      this.proximityTimerId = setTimeout(() => {
        this.pauseTimer.wake();
        this.proximityTimerId = undefined;
      }, this.PROXIMITY_ON_WAIT);
    } else if (this.proximityTimerId !== undefined) {
      dump('App: proximityTimerId cleared.\n');
      clearTimeout(this.proximityTimerId);
      this.proximityTimerId = undefined;
    } else {
      dump('App: Set pauseTimer to turn off screen.');
      this.pauseTimer.countToPause();
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
        this.pauseTimer.togglePaused();

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
    dump(e.toString() + '\n');
  }
};
