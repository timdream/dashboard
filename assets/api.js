'use strict';

var API = function() {
};

API.prototype = {
  start: function() {
    this.deferredId = 1;
    this.deferreds = new Map();
    this.subscriptions = new Map();

    window.addEventListener('message', this);
    dump('Client API: add message listener\n');
  },

  stop: function() {
    this.deferreds = null;
    this.subscriptions = null;

    window.removeEventListener('message', this);
  },

  handleEvent: function(evt) {
    var data = evt.data;

    dump('Client API: receive messaage ' + JSON.stringify(data) + '\n');

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

    dump('Client API: async ' + name + JSON.stringify(args) + '\n');

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

    dump('Client API: notify ' + name + JSON.stringify(args) + '\n');

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
    if (window.parent === window) {
      dump('Client API: No parent to send.\n');
      return false;
    }

    window.parent.postMessage(obj, '*');

    return true;
  },

  Deferred: function() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
};
