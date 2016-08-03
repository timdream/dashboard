'use strict';

var API = function() {
};

API.prototype = {
  start: function() {
    this.deferredId = 1;
    this.deferreds = new Map();
    this.subscriptions = new Map();

    window.addEventListener('message', this);
  },

  stop: function() {
    this.deferreds = null;
    this.subscriptions = null;

    window.removeEventListener('message', this);
  },

  handleEvent: function(evt) {
    var data = evt.data;

    switch (data.type) {
      case 'async':
        var deferred = this.deferreds.get(data.id);
        this.deferreds.delete(data.id);
        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }

        break;

      case 'event':
        var callbacks = this.subscriptions.get(data.name);
        if (!callbacks) {
          break;
        }
        callbacks.forEach((cb) => cb.apply(null, data.args));
        break;

      default:
        console.error('API: unknown message', data);
    }

  },

  async: function(name) {
    var id = this.deferredId++;
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    var deferred = new this.Deferred();
    this.deferreds.set(id, deferred);

    var handled = this._sendMessage({
      type: 'async',
      name: name,
      args: args,
      id: id
    });

    if (!handled) {
      deferred.resolve();
    }

    return deferred.promise;
  },

  notify: function(name) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    this._sendMessage({
      type: 'notify',
      name: name,
      args: args
    });
  },

  subscribe: function(name, callback) {
    var callbacks = this.subscriptions.get(name);
    if (!callbacks) {
      callbacks = [];
      this.subscriptions.set(name, callbacks);
    }

    callbacks.push(callback);
  },

  _sendMessage: function(obj) {
    if (!window._dashboardParent) {
      console.warn('API: No parent to send.', obj);
      dump('API: No parent to send.' + JSON.stringify(obj) + '\n');
      return false;
    }

    window._dashboardParent(obj);

    return true;
  },

  Deferred: function() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
};
