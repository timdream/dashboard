'use strict';

var Browser = function() {
};

Browser.prototype = {
  element: null,

  start: function() {
    var el = this.element = document.createElement('iframe');
    el.src = 'data:text/html,<style> body { background: black }</style>';

    document.body.appendChild(el);
  },

  show: function() {
    this.element.hidden = false;
  },

  hide: function() {
    this.element.hidden = true;
  },

  setLocation: function(src) {
    var el = this.element;
    el.src = 'data:text/html,<style> body { background: black }</style>';
    el.src = src;

    return new Promise((res) => {
      el.addEventListener('load', function loaded() {
        el.removeEventListener('load', loaded);
        res();
      });
    });
  },

  stop: function() {
    document.body.removeChild(el);
  }
}
