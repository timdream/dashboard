'use strict';

var Hud = function() {
  this.mainBrowser = new Browser();
};

Hud.prototype = {
  TIME_URL: 'http://time.is/just/?c=d3l1_3F_3j1_3Y1_3WXth2iAXftXc1Xo480Xz1Xa1Xb51ea29.4e4185.28571f.2d99db.80265.1bb85e.1c3b23Xw0Xv20160801Xh0XiXZ1XmXuXT0Xs0&l=en',

  start: function() {
    var pArr = [];

    pArr.push(this.mainBrowser.start());

    return Promise.all(pArr)
      .then(() => this.mainBrowser.element.classList.add('main'))
      .then(() => this.mainBrowser.setLocation(this.TIME_URL));
  },

  stop: function() {
    this.mainBrowser.stop();
  }
};
