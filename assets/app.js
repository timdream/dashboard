'use strict';

var App = function() {
  this.api = new API();
  this.hud = new Hud();
};

App.prototype = {
  start: function() {
    var pArr = [];
    pArr.push(this.api.start());
    pArr.push(this.hud.start());

    this.queue = Promise.resolve()
      .then(() => this.toggleLoading(true))
      .then(() => Promise.all(pArr))
      .then(() => this.toggleLoading(false))
      .catch((e) => this._handleError(e));
  },

  toggleLoading: function(isLoading) {
    document.body.classList.remove('init');
    document.body.classList.toggle('loading', isLoading);
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
