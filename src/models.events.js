'use strict';

angular.module('angular.models')

.service('BaseEventClass', function (Extend, _) {

  /**
   * @class BaseEventClass
   * @description A module that can be mixed in to *any object* in order to provide it with
   *              custom events. You may bind with `on` or remove with `off` callback
   *              functions to an event; `trigger`-ing an event fires all callbacks in
   *              succession.
   * @example <caption>Define a custom class based on BaseEventClass</caption>
   * var MyObject = BaseEventClass.extend({
   *   'doSomething': {
   *     value: function () {
   *       this.trigger('custom', this);
   *     }
   *   }
   * });
   *
   * var myObject = new MyObject();
   * myObject.on('custom', function (self) {
   *   console.log('the custom event has been triggered');
   * });
   *
   * myObject.doSomething(); // this will trigger the custom event
   */
  var BaseEventClass = function () {};

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // The reducing API that adds a callback to the `events` object.
  var onApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context, ctx = options.ctx, listening = options.listening;
      if (listening) { listening.count++; }

      handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
    }
    return events;
  };

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`), reducing them by manipulating `memo`.
  // Passes a normalized single event name and callback, as well as any
  // optional `opts`.
  var eventsApi = function(iteratee, memo, name, callback, opts) {
    var i = 0, names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) {
        opts.context = callback;
      }
      for (names = _.keys(name); i < names.length; i++) {
        memo = iteratee(memo, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        memo = iteratee(memo, names[i], callback, opts);
      }
    } else {
      memo = iteratee(memo, name, callback, opts);
    }
    return memo;
  };

  // An internal use `on` function, used to guard the `listening` argument from
  // the public API.
  var internalOn = function(obj, name, callback, context, listening) {
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
      context: context,
      ctx: obj,
      listening: listening
    });

    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }

    return obj;
  };

  // The reducing API that removes a callback from the `events` object.
  var offApi = function(events, name, callback, options) {
    // No events to consider.
    if (!events) { return null; }

    var i = 0, listening;
    var context = options.context, listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
      var ids = _.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return null;
    }

    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      // Bail out if there are no events stored.
      if (!handlers) { break; }

      // Replace events if there are any remaining.  Otherwise, clean up.
      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
            callback !== handler.callback._callback ||
              context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (_.size(events)) { return events; }
  };

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  var onceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = _.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy.
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
    case 0: while (++i < l) { (ev = events[i]).callback.call(ev.ctx); } return;
    case 1: while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1); } return;
    case 2: while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1, a2); } return;
    case 3: while (++i < l) { (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); } return;
    default: while (++i < l) { (ev = events[i]).callback.apply(ev.ctx, args); } return;
    }
  };

  // Handles triggering the appropriate event callbacks.
  var triggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) { allEvents = allEvents.slice(); }
      if (events) { triggerEvents(events, args); }
      if (allEvents) { triggerEvents(allEvents, [name].concat(args)); }
    }
    return objEvents;
  };

  /**
   * Bind an event to a `callback` function. Passing `"all"` will bind
   * the callback to all events fired.
   * @function BaseEventClass#on
   * @param  {string}   name     An event name
   * @param  {Function} callback A callback funciton
   * @param  {Object}   context  A context
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.on = function(name, callback, context) {
    return internalOn(this, name, callback, context);
  };

  /**
   * Inversion-of-control versions of `on`. Tell *this* object to listen to
   * an event in another object... keeping track of what it's listening to.
   * @function BaseEventClass#listenTo
   * @param {object} object An object which events to listen
   * @param {string} name An event name
   * @param {Function} callback A callback function
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.listenTo = function(obj, name, callback) {
    if (!obj) { return this; }
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
      listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  };


  /**
   * @function BaseEventClass#off
   * @description Remove one or many callbacks. If `context` is null, removes all
   *              callbacks with that function. If `callback` is null, removes all
   *              callbacks for the event. If `name` is null, removes all bound
   *              callbacks for all events.
   * @param  {String}   name     An event name
   * @param  {Function} callback An event handler
   * @param  {Mix}      context  An event handler's context
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.off = function(name, callback, context) {
    if (!this._events) { return this; }
    this._events = eventsApi(offApi, this._events, name, callback, {
      context: context,
      listeners: this._listeners
    });
    return this;
  };

  /**
   * @function BaseEventClass#stopListening
   * @description Tell this object to stop listening to either specific events ... or
   *              to every object it's currently listening to.
   * @param  {Object}   obj      An object whose an event should be stopped listen.
   * @param  {String}   name     An event name
   * @param  {Function} callback An event handler
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.stopListening = function(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) { return this; }

    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    for (var i = 0; i < ids.length; i++) {
      var listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) { break; }

      listening.obj.off(name, callback, this);
    }
    if (_.isEmpty(listeningTo)) { this._listeningTo = void 0; }

    return this;
  };


  /**
   * @function BaseEventClass#once
   * @description Bind an event to only be triggered a single time. After the first time
   *              the callback is invoked, it will be removed. When multiple events are
   *              passed in using the space-separated syntax, the event will fire once for every
   *              event you passed in, not once for a combination of all events
   * @param  {String}   name     An event name
   * @param  {Function} callback An event handler
   * @param  {Mix}      context  An event handler's context
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.once = function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
  };

  //
  /**
   * @function BaseEventClass#listenToOnce
   * @description Inversion-of-control versions of `once`.
   * @param  {String}   name     An event name
   * @param  {Function} callback An event handler
   * @param  {Mix}      context  An event handler's context
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.listenToOnce = function(obj, name, callback) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
  };

  /**
   * @function BaseEventClass#trigger
   * @description Trigger one or many events, firing all bound callbacks. Callbacks are
   *              passed the same arguments as `trigger` is, apart from the event name
   *              (unless you're listening on `"all"`, which will cause your callback to
   *              receive the true name of the event as the first argument).
   * @param  {String} name An event name
   * @param  {Mix[]}  args An event arguments
   * @return {BaseEventClass}
   */
  BaseEventClass.prototype.trigger = function(name) {
    if (!this._events) { return this; }

    var length = Math.max(0, arguments.length - 1);
    var args = Array(length);
    for (var i = 0; i < length; i++) { args[i] = arguments[i + 1]; }

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  };

  // Aliases for backwards compatibility.
  // NOTE: Deprecated
  /**
   * @function BaseEventClass#bind
   * @deprecated Will be removed soon
   */
  BaseEventClass.prototype.bind = BaseEventClass.prototype.on;
  /**
   * @function BaseEventClass#unbind
   * @deprecated Will be removed soon
   */
  BaseEventClass.prototype.unbind = BaseEventClass.prototype.off;

  /**
   * @function BaseEventClass~extend
   * @param {Object} proto An object whose own enumerable properties
   *                 constitute descriptors for the properties to be defined or modified.
   *                 See {@link Extend}
   */
  BaseEventClass.extend = Extend;

  return BaseEventClass;
});
