/**
 * angular.models
 * Provides base classes and modules to make applications rapidly
 * @author Eugene Brodsky
 * @version v0.0.5
 * @link https://github.com/fupslot/angular-models
 * @license MIT License
 */

(function (window, angular, undefined) {
'use strict';
angular.module('angular.models', []);

'use strict';

angular.module('angular.models')

.factory('BaseClass', ['Extend', function (Extend) {
  /**
   * @class BaseClass
   * @description A base class constructor
   *
   * @example <caption>How to create a basic class</caption>
   * var Person = BaseClass.extend({
   *   constructor: function(name) {
   *     this._name = name;
   *   },
   *   name: {
   *     get: function() {
   *       return this._name;
   *     }
   *   }
   * });
   *
   * var person = new Person('Eugene');
   * person.name; //-> 'Eugene'
   */
  function BaseClass(){}
  BaseClass.extend = Extend;
  BaseClass.typeOf = function(obj) {return obj instanceof this;};
  BaseClass.prototype.typeOf = function typeOf(obj) {
    return this instanceof obj;
  };
  return BaseClass;
}]);

'use strict';

angular.module('angular.models')

.factory('BaseCollectionClass', ['$q', 'BaseSyncClass', 'BaseModelClass', 'WrapError', '_', function ($q, BaseSyncClass, BaseModelClass, WrapError, _) {

  var BaseCollectionClass;


  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  BaseCollectionClass = BaseSyncClass.extend({


    /**
     * @class BaseCollectionClass
     * @description Create a new **Collection**, perhaps to contain a specific type of `model`.
     *              If a `comparator` is specified, the Collection will maintain
     *              its models in sort order, as they're added and removed.
     * @param {BaseModelClass[]} models An array of BaseModelClass instances.
     * @param {Object} options An options
     */
    constructor: function (models, options){
      options = options || {};
      if (options.model) {
        this.model = options.model;
      }
      if (options.comparator !== void 0) {
        this.comparator = options.comparator;
      }
      this.$reset();
      this.initialize.apply(this, arguments);
      if (models) {
        this.reset(models, _.extend({silent: true}, options));
      }
    },

    /**
     * @property {BaseModelClass} BaseCollectionClass#model
     * @description The default model is null.
     *              This should be overridden in all cases.
     * @type {BaseModelClass}
     */
    model: {value: null, writable: true},


    /**
     * @function BaseCollectionClass#initialize
     * @description Initialize is an empty function by default. Override it with your own
     *              initialization logic.
     */
    initialize: {value: _.noop, writable: true},


    /**
     * @function BaseCollectionClass#toJSON
     * @description The JSON representation of a Collection is an array of the
     *              models' attributes.
     * @param  {object} options An options object
     * @return {JSON}
     */
    toJSON: function (options) {
      return this.map(function(model){ return model.toJSON(options); });
    },


    /**
     * @function BaseCollectionClass#add
     * @description Add a model, or list of models to the set.
     * @return {BaseModelClass}
     */
    add: function (models, options) {
      return this.$set(models, _.extend({merge: false}, options, addOptions));
    },


    /**
     * @function BaseCollectionClass#remove
     * @description Remove a model, or a list of models from the set.
     * @return {BaseModelClass}
     */
    remove: function remove(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models); // ? method 'clone' doesn't make deep clone copy
      options = options || {};
      for (var i = 0, length = models.length; i < length; i++) {
        var model = models[i] = this.get(models[i]);
        if (!model) {
          continue;
        }
        var id = this.modelId(model.attributes);
        if (id != null) {
          delete this._byId[id];
        }
        delete this._byId[model.cid];
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this.$removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    /**
     * @function BaseCollectionClass#$set
     * @description Update a collection by `set`-ing a new list of models, adding new ones,
     *              removing models that are no longer present, and merging models that
     *              already exist in the collection, as necessary. Similar to **Model#set**,
     *              the core operation for updating the data contained by the collection.
     * @return {BaseModelClass}
     */
    $set: function $set(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) {
        // models = this.parse(models, options);
        models = _.isString(this.parse) ? _.result(models, this.parse) :  this.parse(models, options);
      }
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : models.slice(); //slice.apply(models);
      var id, model, attrs, existing, sort;
      var at = options.at;
      if (at < 0) {
        at += this.length + 1;
      }
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;
      var orderChanged = false;
      var i;
      var length;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, length = models.length; i < length; i++) {
        attrs = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(attrs)) {
          if (remove) {
            modelMap[existing.cid] = true;
          }
          if (merge && attrs !== existing) {
            attrs = BaseModelClass.typeOf(attrs) ? attrs.attributes : attrs;
            if (options.parse) {
              attrs = existing.parse(attrs, options);
            }
            existing.$set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) {
              sort = true;
            }
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this.$prepareModel(attrs, options);
          if (!model) {
            continue;
          }
          toAdd.push(model);
          this.$addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (!model) {
          continue;
        }
        id = this.modelId(model.attributes);
        if (order && (model.isNew() || !modelMap[id])) {
          order.push(model);

          // Check to see if this is actually a new model at this index.
          orderChanged = orderChanged || !this.models[i] || model.cid !== this.models[i].cid;
        }

        modelMap[id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, length = this.length; i < length; i++) {
          if (!modelMap[(model = this.models[i]).cid]) {
            toRemove.push(model);
          }
        }
        if (toRemove.length) {
          this.remove(toRemove, options);
        }
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || orderChanged) {
        if (sortable) {
          sort = true;
        }
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, length = toAdd.length; i < length; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) {
            this.models.length = 0;
          }
          var orderedModels = order || toAdd;
          for (i = 0, length = orderedModels.length; i < length; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) {
        this.sort({silent: true});
      }

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        var addOpts = at != null ? _.clone(options) : options;
        for (i = 0, length = toAdd.length; i < length; i++) {
          if (at != null) {
            addOpts.index = at + i;
          }
          (model = toAdd[i]).trigger('add', model, this, addOpts);
        }
        if (sort || orderChanged) {
          this.trigger('sort', this, options);
        }
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },


    /**
     * @function BaseCollectionClass#reset
     * @description When you have more items than you want to add or remove individually,
     *              you can reset the entire set with a new list of models, without firing
     *              any granular `add` or `remove` events. Fires `reset` when finished.
     *              Useful for bulk operations and optimizations.
     * @return {BaseModelClass}
     */
    reset: function reset(models, options) {
      options = options ? _.clone(options) : {};
      for (var i = 0, length = this.models.length; i < length; i++) {
        this.$removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this.$reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) {
        this.trigger('reset', this, options);
      }
      return models;
    },


    /**
     * @function BaseCollectionClass#get
     * @description Get a model from the set by id.
     * @return {BaseModelClass}
     */
    get: function (obj) {
      if (obj == null) {
        return void 0;
      }
      var id = this.modelId(BaseModelClass.typeOf(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },


    /**
     * @function BaseCollectionClass#at
     * @description Get the model at the given index.
     * @return {BaseModelClass}
     */
    at: function (index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },


    /**
     * @function BaseCollectionClass#where
     * @description Return models with matching attributes. Useful for simple cases of
     *              `filter`.
     * @return {BaseModelClass}
     */
    where: function (attrs, first) {
      var matches = _.matches(attrs);
      return this[first ? 'find' : 'filter'](function(model) {
        return matches(model.attributes);
      });
    },


    /**
     * @function BaseCollectionClass#findWhere
     * @description Return the first model with matching attributes. Useful for simple cases
     *              of `find`.
     * @return {BaseModelClass}
     */
    findWhere: function (attrs) {
      return this.where(attrs, true);
    },


    /**
     * @function BaseCollectionClass#sort
     * @description Force the collection to re-sort itself. You don't need to call this under
     *              normal circumstances, as the set will maintain sort order as each item
     *              is added.
     * @return {BaseCollectionClass}
     */
    sort: function (options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },


    /**
     * @function BaseCollectionClass#pluck
     * @description Pluck an attribute from each model in the collection.
     * @return {type}
     */
    pluck: function (attr) {
      return _.invoke(this.models, 'get', attr);
    },


    /**
     * @function BaseCollectionClass#parse
     * @description **parse** converts a response into a list of models to be added to the
     *              collection. The default implementation is just to pass it through.
     * @return {object}
     */
    parse: function (response) {
      return response;
    },


    /**
     * @function BaseCollectionClass#toArray
     * @return {array}
     */
    toArray: function () {
      return _.invoke(this.models, 'toJSON');
    },


    /**
     * @function BaseCollectionClass#fetch
     * @description Fetch data sources from the server
     * @return {type}
     */
    fetch: function fetch (options) {
      var self = this;
      return $q(function (resolve, reject) {
        options = _.extend({}, options, {parse: true});

        options.success = function success (response) {
          self.$set(response, options);
          self.trigger('fetched', self);
          resolve(self);
        };

        WrapError(self, reject, options);
        self.sync('read', self, options);
      });
    },


    /**
     * @function BaseCollectionClass#create
     * @description Creates a new instance of a model in this collection.
     * @return {Promise}
     */
    create: function (model, options) {
      var self = this;
      options = options ? _.clone(options) : {};
      return $q(function (resolve, reject) {
        if (!(model = self.$prepareModel(model, options))) {
          return reject();
        }
        model.save(options)
          .then(function () {
            self.add(model, options);
            model.trigger('created', model, self,  options);
            resolve(model);
          }, reject);
      });
    },

    /**
     * @function BaseCollectionClass#clone
     * @description Create a new collection with an identical list of models as this one.
     * @return {BaseCollectionClass}
     */
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },


    /**
     * @function BaseCollectionClass#modelId
     * @description Define how to uniquely identify models in the collection.
     * @return {type}
     */
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },


    /**
     * @function BaseCollectionClass~$reset
     * @private
     * @description Private method to reset all internal state. Called when the collection
     *              is first initialized or reset.
     */
    $reset: function () {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },


    /**
     * @function BaseCollectionClass~$prepareModel
     * @private
     * @description Prepare a hash of attributes (or other model) to be added to this
     *              collection.
     * @return {BaseModelClass}
     */
    $prepareModel: function (attrs, options) {
      if (BaseModelClass.typeOf(attrs)) {
        if (!attrs.collection) {
          attrs.collection = this;
        }
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) {
        return model;
      }
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },


    /**
     * @function BaseCollectionClass~$addReference
     * @private
     * @description Internal method to create a model's ties to a collection.
     */
    $addReference: function (model) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) {
        this._byId[id] = model;
      }
      model.on('all', this.$onModelEvent, this);
    },



    /**
     * @function BaseCollectionClass~$removeReference
     * @private
     * @description Internal method to sever a model's ties to a collection.
     * @return {type}
     */
    $removeReference: function (model) {
      if (this === model.collection) {
        delete model.collection;
      }
      model.off('all', this.$onModelEvent, this);
    },


    /**
     * @function BaseCollectionClass~$onModelEvent
     * @private
     * @description Internal method called every time a model in the set fires an event.
     *              Sets need to update their indexes when models change ids. All other
     *              events simply proxy through. "add" and "remove" events that originate
     *              in other collections are ignored.
     */
    $onModelEvent: function (event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) {
        return;
      }
      if (event === 'destroy') {
        this.remove(model, options);
      }
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) {
            delete this._byId[prevId];
          }
          if (id != null) {
            this._byId[id] = model;
          }
        }
      }
      this.trigger.apply(this, arguments);
    }
  });


  // Lodash methods that we want to implement on the Collection.
  var methods = ['each', 'map', 'find', 'filter', 'invoke',
      'reject', 'every', 'all', 'some', 'any', 'contains',
      'size', 'first', 'last', 'isEmpty', 'indexOf', 'indexBy'];

  // Mix in each Lodash method as a proxy to (Collection#models).
  _.each(methods, function(method) {
    if (!_[method]) { return; }

    Object.defineProperty(BaseCollectionClass.prototype, method, {
      value: function () {
        var args = [].slice.call(arguments);
        args.unshift(this.models);
        return _[method].apply(_, args);
      }
    });
  });

  return BaseCollectionClass;
}]);

'use strict';

angular.module('angular.models')

.service('BaseEventClass', ['BaseClass', '_', function (BaseClass, _) {

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
  var BaseEventClass;

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


  BaseEventClass = BaseClass.extend({

    /**
     * Bind an event to a `callback` function. Passing `"all"` will bind
     * the callback to all events fired.
     * @function BaseEventClass#on
     * @param  {string}   name     An event name
     * @param  {Function} callback A callback funciton
     * @param  {Object}   context  A context
     * @return {BaseEventClass}
     */
    on: function on(name, callback, context) {
      return internalOn(this, name, callback, context);
    },

    /**
     * Inversion-of-control versions of `on`. Tell *this* object to listen to
     * an event in another object... keeping track of what it's listening to.
     * @function BaseEventClass#listenTo
     * @param {object} object An object which events to listen
     * @param {string} name An event name
     * @param {Function} callback A callback function
     * @return {BaseEventClass}
     */
    listenTo: function listenTo(obj, name, callback) {
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
    },

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
    off: function off(name, callback, context) {
      if (!this._events) { return this; }
      this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
      });
      return this;
    },

    /**
     * @function BaseEventClass#stopListening
     * @description Tell this object to stop listening to either specific events ... or
     *              to every object it's currently listening to.
     * @param  {Object}   obj      An object whose an event should be stopped listen.
     * @param  {String}   name     An event name
     * @param  {Function} callback An event handler
     * @return {BaseEventClass}
     */
    stopListening: function stopListening(obj, name, callback) {
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
    },

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
    once: function once(name, callback, context) {
      // Map the event into a `{event: once}` object.
      var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
      return this.on(events, void 0, context);
    },

    /**
     * @function BaseEventClass#listenToOnce
     * @description Inversion-of-control versions of `once`.
     * @param  {String}   name     An event name
     * @param  {Function} callback An event handler
     * @param  {Mix}      context  An event handler's context
     * @return {BaseEventClass}
     */
    listenToOnce: function listenToOnce(obj, name, callback) {
      // Map the event into a `{event: once}` object.
      var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
      return this.listenTo(obj, events);
    },

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
    trigger: function trigger(name) {
      if (!this._events) { return this; }

      var length = Math.max(0, arguments.length - 1);
      var args = Array(length);
      for (var i = 0; i < length; i++) { args[i] = arguments[i + 1]; }

      eventsApi(triggerApi, this._events, name, void 0, args);
      return this;
    }
  });



  // Aliases for backwards compatibility.
  // NOTE: Deprecated
  /**
   * @function BaseEventClass#bind
   * @deprecated Will be removed soon
   */
  // BaseEventClass.prototype.bind = BaseEventClass.prototype.on;
  /**
   * @function BaseEventClass#unbind
   * @deprecated Will be removed soon
   */
  // BaseEventClass.prototype.unbind = BaseEventClass.prototype.off;

  /**
   * @function BaseEventClass~extend
   * @param {Object} proto An object whose own enumerable properties
   *                 constitute descriptors for the properties to be defined or modified.
   *                 See {@link Extend}
   */
  // BaseEventClass.extend = Extend;

  return BaseEventClass;
}]);

'use strict';

angular.module('angular.models')

.factory('BaseModelClass', ['$q', '$parse', 'BaseSyncClass', 'WrapError', 'ValidationExceptionClass', '_', function ($q, $parse, BaseSyncClass, WrapError, ValidationExceptionClass, _) {

  // var proto;

  /**
   * Throw a change event.
   * @fires BaseModelClass#change
   */

  /**
   * Throw a sync event.
   * @fires BaseModelClass#sync
   */

  /**
   * Throw a fetched event.
   * @fires BaseModelClass#fetched
   */

  /**
   * Throw a destroy event.
   * @fires BaseModelClass#destroy
   */

   /**
   * Throw a invalid event.
   * @fires BaseModelClass#invalid
   */
  var BaseModelClass;

  BaseModelClass = BaseSyncClass.extend({
    /**
     * @class BaseModelClass
     * @description This base class represents common methods of a model
     * @param {Object} attributes A model's attributes. A key-value object.
     * @param {Object} options    An options.
     *
     * @example <caption>Defining a Book class</caption>
     * var Book = BaseModelClass.extend({
     *   'defaults': {
     *     value: {
     *       title: Untitled book
     *     },
     *     enumerable: true
     *   }
     * });
     *
     * var book = new Book({title: 'Sherlock Holmes'});
     * console.log(book.get('title')); //-> Sherlock Holmes
     *
     * @example <caption>Defining a Book class with a custom constrictor, custom accessors and default attributes</caption>
     * var Book = BaseModelClass.extend({
     *   'defaults': {
     *     value: {
     *       title: 'Untitled book'
     *     }
     *   },
     *
     *   constructor: {
     *     value: function () {
     *       // do somethig before the super class constructor call
     *
     *       // If the constructor was re-defined, you must
     *       // call the super class constructor manually
     *       BaseModelClass.apply(this, arguments);
     *
     *       // do somethig after the super class constructor call
     *     }
     *   },
     *
     *   title: {
     *     get: function () {
     *       return this.$get('title');
     *     },
     *     set: function(value) {
     *       this.$set('title', value);
     *     },
     *     enumerable: true
     *   }
     * });
     *
     * var book = new Book({title: 'Sherlock Holmes'});
     * console.log(book.title); //-> Sherlock Holmes
     */
    constructor: function(attributes, options){
      var attrs = attributes || {};
      options = options || {};
      this.cid = _.uniqueId('c');
      this.attributes = {};

      if (options.parse) {
        attrs = _.isString(this.parse) ? _.result(attrs, this.parse, {}) : (this.parse(attrs, options) || {});
      }
      if (options.collection) {
        this.collection = options.collection;
      }

      attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

      this.$set(attrs, options);
      this.changed = {};
      this.initialize.apply(this, arguments);
    },

    /**
     * @member {Object} BaseModelClass#defaultQueryParams
     * @description A hash of query parameters.
     *
     * @example <caption>Define a custom model with a set of query params</caption>
     * var MyModel = BaseModelClass.extend({
     *   urlRoot: {value: '/api/models'},
     *   paramSort: {
     *     value: function () {
     *       // this - reference to a current model's instance
     *       if (this.$get('sort') === true) {
     *         return 'abc';
     *       }
     *       else {
     *         return 'desc';
     *       }
     *     }
     *   },
     *   // NOTE: Order is not guaranteed.
     *   defaultQueryParams: {
     *     value: {
     *       // Defining a static parameter 'type' with a value 'single'
     *       'type': 'single',
     *       // Symbol '@' tells to a model to extract
     *       // a parameter's value from a model's attribute set
     *       'id': '@id',
     *       // Symbol '=' tell to a model to evaluate a paramSort method
     *       // and use the returned value as a value for a query parameter.
     *       // If method was not defined, a 'null' value will be applied.
     *       'sort': '=paramSort'
     *     }
     *   }
     * });
     *
     * var myModel = new MyModel({id: 1});
     * myModel.fetch(); //-> GET /api/models/1?id=1&type=single&sort=desc
     *
     * myModel.$set('sort', true);
     * myModel.fetch(); //-> GET /api/models/1?id=1&type=single&sort=abc
     */
    defaultQueryParams: {value: {}, writable: true},


    /**
     * @member {object} BaseModelClass#changed
     * @description A hash of attributes whose current and previous value differ.
     * @type {object}
     */
    changed: {value: null, writable: true},


    /**
     * @member {object} BaseModelClass#validationError
     * @description The value returned during the last failed validation.
     * @type {object}
     */
    validationError: {value: null, writable: true},


    /**
     * @member {string} BaseModelClass#idAttribute
     * @description The default name for the JSON `id` attribute is `"id"`. MongoDB and
     *              CouchDB users may want to set this to `"_id"`.
     * @type {string}
     */
    idAttribute: {value: 'id', writable: true},


    /**
     * @function BaseModelClass#initialize
     * @description Initialize is an empty function by default. Override it with your own
     *              initialization logic.
     */
    initialize: {value: _.noop, writable: true},


    /**
     * @member {array} BaseModelClass#serializeModel
     * @description Holds a list of models which will be included into the model when method 'toJSON' called
     * @type {array}
     */
    serializeModel: {value: [], writable: true},


    /**
     * @function BaseModelClass#toJSON
     * @description  Return a copy of the model's `attributes` object.
     * @return {JSON}
     */
    toJSON: function toJSON() {
      var self = this;
      var obj = _.cloneDeep(this.attributes);

      if (_.isArray(this.serializeModel) && this.serializeModel.length) {
        _.each(this.serializeModel, function (key) {
          obj[key] = ('toJSON' in self[key]) ? self[key].toJSON() : null;
        });
      }
      return obj;
    },


    /**
     * @function BaseModelClass#$get
     * @description Get the value of an attribute.
     * @param {string} attr A field name
     */
    $get: function $get (attr) {
      // NOTE: Improve
      // if field name has a dot use $parse othewise return a value from attributes
      var getter = $parse(attr);
      return getter(this.attributes);
    },


    /**
     * @function BaseModelClass#is
     * @param  {string} attr A field name
     * @return {boolean} Returns true if a given field exists in a current instance of BaseModelClass
     */
    is: function is (attr) {
      return !!this.attributes[attr];
    },


    /**
     * @function BaseModelClass#has
     * @description Returns `true` if the attribute contains a value that is not null
     *              or undefined.
     * @param  {string} attr
     * @return {boolean}
     */
    has: function has (attr) {
      return this.$get(attr) != null;
    },


    /**
     * @function BaseModelClass#$set
     * @description Set a hash of attributes (one or many) on the model.
     *              If any of the attributes change the model's state, a "change" event
     *              will be triggered on the model. Change events for specific attributes
     *              are also triggered, and you can bind to those as well,
     *              for example: change:title, and change:content. You may also pass individual keys and values.
     * @return {BaseModelClass} Return a reference on a current instance of BaseModelClass
     */
    $set: function $set (key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) {
        return this;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = options || {};
      // Try run validate function any time
      options.validate = true;

      // Run validation.
      var error = this.$validate(attrs, options);
      if (error instanceof ValidationExceptionClass) {
        return false;
      }

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }

      current = this.attributes;
      prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) {
        this.id = attrs[this.idAttribute];
      }

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) {
          changes.push(attr);
        }
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }

        if (unset === true) {
          delete current[attr];
        }
        else {
          current[attr] = val;
        }
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) {
          this._pending = options;
        }
        for (var i = 0, length = changes.length; i < length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) {
        return this;
      }
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },


    /**
     * @function BaseModelClass#unset
     * @description Remove an attribute from the model, firing `"change"`. `unset` is a noop
     *              if the attribute doesn't exist.
     */
    unset: function unset (attr, options) {
      return this.$set(attr, void 0, _.extend({}, options, {unset: true}));
    },


    /**
     * @function BaseModelClass#clear
     * @description Clear all attributes on the model, firing `"change"`.
     */
    clear: function clear (options) {
      var attrs = {};
      for (var key in this.attributes) {
        attrs[key] = void 0;
      }
      return this.$set(attrs, _.extend({}, options, {unset: true}));
    },


    /**
     * @function BaseModelClass#hasChange
     * @description Determine if the model has changed since the last `"change"` event.
     *              If you specify an attribute name, determine if that attribute has changed.
     * @param  {string} attr
     * @return {boolean}
     */
    hasChanged: function hasChanged (attr) {
      if (attr == null) {
        return !_.isEmpty(this.changed);
      }
      return _.has(this.changed, attr);
    },


    /**
     * @function BaseModelClass#changedAttributes
     * @description Return an object containing all the attributes that have changed, or
     *              false if there are no changed attributes. Useful for determining what
     *              parts of a view need to be updated and/or what attributes need to be
     *              persisted to the server. Unset attributes will be set to undefined.
     *              You can also pass an attributes object to diff against the model,
     *              determining if there *would be* a change.
     * @param  {object} diff
     * @return {object}
     */
    changedAttributes: function changedAttributes (diff) {
      if (!diff) {
        return this.hasChanged() ? _.clone(this.changed) : false;
      }
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) {
          continue;
        }
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },


    /**
     * @function BaseModelClass#previuos
     * @description Get the previous value of an attribute, recorded at the time the last
     *              `"change"` event was fired.
     * @param  {string} attr
     * @return {mix}
     */
    previous: function previous (attr) {
      if (attr == null || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    },


    /**
     * @function BaseModelClass#previousAttributes
     * @description Get all of the attributes of the model at the time of the previous
     *              <code>change</code> event.
     * @return {object}
     */
    previousAttributes: function previousAttributes () {
      return _.clone(this._previousAttributes);
    },


    /**
     * @function BaseModelClass#url
     * @description Default URL for the model's representation on the server -- if you're
     *              using Backbone's restful methods, override this to change the endpoint
     *              that will be called.
     * @return {string}
     */
    url: function url () {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');

      if (base == null) {
        throw new Error('A "url" property or function must be specified');
      }

      if (this.isNew()) {
        return base;
      }
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },


    /**
     * @function BaseModelClass#clone
     * @description Creates a new model with identical attributes to this one.
     */
    clone: function clone () {
      return new this.constructor(this.attributes);
    },


    /**
     * @function BaseModelClass#isNew
     * @description A model is new if it has never been saved to the server, and lacks an id.
     * @return {boolean}
     */
    isNew: function isNew () {
      return !this.has(this.idAttribute);
    },


    /**
     * @function BaseModelClass#isValid
     * @description Check if the model is currently in a valid state.
     * @return {boolean}
     */
    isValid: function isValid (options) {
      return this.$validate({}, _.extend(options || {}, { validate: true }));
    },


    /**
     * @function BaseModelClass#parse
     * @return {object}
     */
    parse: function parse (response) {
      return response;
    },


    /**
     * @function BaseModelClass#save
     * @return {Promise}
     */
    save: function save (options) {
      options = _.extend({validate: true}, options);
      var model = this;
      var operation = model.isNew() ? 'create' : 'update';

      return $q(function (resolve, reject) {
        if (!model.url()) {
          return reject();
        }

        if (!model.$validate({}, options)) {
          return reject(model.validationError);
        }

        options.success = function success (response) {
          if (!model.$set(model.parse(response))) {
            return reject(response);
          }
          model.trigger('sync', model);
          resolve(model);
        };
        WrapError(model, reject, options);
        model.sync(operation, model, options);
      });
    },


    /**
     * @function BaseModelClass#fetch
     * @description Fetch the document from the server.
     * @return {Promise}
     */
    fetch: function fetch (options) {
      var model = this;
      options = _.extend({}, options);

      return $q(function (resolve, reject) {
        options.success = function (response) {
          if (!model.$set(model.parse(response))) {
            return reject(response);
          }
          model.trigger('fetched', model, response);
          resolve(model);
        };
        WrapError(model, reject, options);
        model.sync('read', model, options);
      });
    },


    /**
     * @function BaseModelClass#destroy
     * @description Destroy this model on the server if it was already persisted.
     * @return {Promise}
     */
    destroy: function destroy (options) {
      options = _.extend({}, options);
      var model = this;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      return $q(function (resolve, reject) {
        options.success = function(resp) {
          if (!model.isNew()) {
            model.trigger('sync', model, resp, options);
          }
          destroy();
          resolve(model);
        };
        // If model is new just call 'success' method without send a request on a server
        if (model.isNew()) {
          return options.success();
        }
        WrapError(model, reject, options);
        model.sync('delete', model, options);
      });
    },


    /**
     * @function BaseModelClass#remove
     * @description Removes a model from a collection if it was exist
     */
    remove: function remove (options) {
      if (!this.collection) {
        return;
      }
      this.collection.remove(this, options);
    },


    /**
     * @function BaseModelClass#setQueryParam
     * @param  {String} key    A parameter's name
     * @param  {Mix} value     A parameter's value
     * @memberOf BaseModelClass
     */
    setQueryParam: function (key, value) {
      if (value != null) {
        this.defaultQueryParams[key] = value;
      }
      else {
        delete this.defaultQueryParams[key];
      }
    },


    /**
     * @function BaseModelClass#getQueryParams
     * @description Returns a key-value object which containing a query parameters
     * @param {Object} params A hash of query parameters. If any matches found then a default set will overridden.
     * @return {Object}
     */
    getQueryParams: function getQueryParams (params) {
      var values = {};
      params = params || {};
      _.each(this.defaultQueryParams, function(value, key) {
        if (_.startsWith(value, '@')) {
          values[key] = this.$get(_.trimLeft(value, '@'));
        }
        else if (_.startsWith(value, '=')) {
          values[key] = _.result(this, _.trimLeft(value, '='), null);
        }
        else {
          values[key] = value;
        }
      }, this);

      return _.extend({}, values, params);
    },


    /**
     * @function BaseModelClass#$validate
     * @private
     * @description Run validation against the next complete set of model attributes,
     *              returning `true` if all is well. Otherwise, fire an `"invalid"` event.
     * @return {boolean}
     */
    $validate: function $validate (attrs, options) {
      if (!options.validate || !this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!(error instanceof ValidationExceptionClass)) {
        return true;
      }
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });


  /**
   * @event BaseModelClass#change
   * @description Occured when one ore many attributes set on the model by using {@link: BaseModelClass#set}.
   *              You can also monitor a change event for specific attributes, for example:
   *              change:title (where title is an attribute)
   * @param {BaseModelClass} model A model
   * @param {mix} changed a changed value
   * @param {object} options An options
   *
   * @example <caption>Listening a change event on the model</caption>
   * //
   * model.on('change', function (model, attrs, options) {
   *   console.log('changed attributes, %s', attrs);
   * });
   *
   * @example <caption>Listening a change event for a specific attribute</caption>
   * //
   * model.on('change:title', function (model, attrs, options) {
   *   console.log('changed attributes, %s', attrs);
   * });
   */

  /**
   * @event BaseModelClass#sync
   * @description A sync event. Fires everytime when a model approaches a server.
   * @param {string} method HTTP/1.1 methods. GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS etc.
   * @param {BaseModelClass} model A model where <kbd>sync</kbd> event triggered.
   * @param {object} options An options
   */

   // This will make a BaseModeClass is extendable
  // BaseModelClass.extend = Extend;

  return BaseModelClass;
}]);

'use strict';

angular.module('angular.models')

.provider('BaseSyncClass', function () {

  // The HTTP method map.
  var CRUD_MAP = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  this.setOperation = function setOperation(operation, method) {
    if (CRUD_MAP.hasOwnProperty(operation)) {
      CRUD_MAP[operation] = method;
    }
  };

  this.$get = /*@ngInject*/ ['$http', '_', 'Extend', 'BaseEventClass', function($http, _, Extend, BaseEventClass) {
    /**
     * @class BaseSyncClass
     * @description Override this function to change the manner in which Backbone persists
     *              models to the server. You will be passed the type of request, and the
     *              model in question. By default, makes a RESTful Ajax request
     *              to the model's `url()`. Some possible customizations could be:
     *
     *              * Use `setTimeout` to batch rapid-fire updates into a single request.
     *              * Send up the models as XML instead of JSON.
     *              * Persist models via WebSockets instead of Ajax.
     *
     *              Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
     *              as `POST`, with a `_method` parameter containing the true HTTP method,
     *              as well as all requests with the body as `application/x-www-form-urlencoded`
     *              instead of `application/json` with the model in a param named `model`.
     *              Useful when interfacing with server-side languages like **PHP** that make
     *              it difficult to read the body of `PUT` requests.
     */
    // function BaseSyncClass () {}

    // proto = BaseSyncClass.prototype = Object.create(BaseEventClass.prototype);

    return BaseEventClass.extend({

      /**
       * @function BaseSyncClass#sync
       * @description Proxy `BaseSyncClass` by default.
       *              Override this if you need custom syncing semantics for a particular model.
       * @param  {string} method  One of a CRUD operations. Ex: read, create, update or delete.
       * @param  {BaseModelClass} model An instance of a model class where the sync method have been called
       * @param  {Object} options An options
       * @return {Promise}
       *
       * @example <caption>How to re-map CRUD operations</caption>
       * angular.module('myProject', ['angular.models'])
       *   // Default map:
       *   //  'create' -> 'POST'
       *   //  'read' -> 'GET'
       *   //  'update' -> 'PUT'
       *   //  'delete' -> 'DELETE'
       *   //  'patch' -> 'PATCH'
       *   .config(function (SyncProvider) {
       *     // It will force BaseModelClass and BaseCollectionClass
       *     // invoke a 'POST' method instead of 'GET'.
       *     // NOTE: All you models and collection will inherit that behaviour
       *     // as long as you won't override it for a particular class.
       *     SyncProvider.setOperation('read', 'POST');
       *   })
       *   .factory('MyModelClass', function (BaseModelClass) {
       *     return BaseModelClass.extend({
       *       urlRoot: { value: '/api/models'}
       *     });
       *   })
       *   .controller(function(MyModelClass){
       *     var myModel = new MyModelClass();
       *     myModel.fetch(); //-> Will reserve a POST request
       *   });
       */
      sync: function (method, model, options) {
        var dynamicQueryParams = {};

        method = CRUD_MAP[method];

        // Default options, unless specified.
        _.defaults(options || (options = {}));

        // Request method, unless specified
        options.method = options.method || method;

        // Default JSON-request options.
        var params = _.pick(options, ['method', 'cache', 'timeout', 'params', 'withCredentials', 'xsrfHeaderName', 'xsrfCookieName']);

        params.headers = options.headers || {};

        // Set 'Accept' header by default
        if (!params.headers['accept']) {
          params.headers['accept'] = 'application/json, text/plain, */*';
        }

        params.url = options.url || _.result(model, 'url');
        // Ensure that we have a URL.
        if (!params.url) {
          throw new Error('A "url" property or function must be specified');
        }

        // Obtains a dynamic query params,
        // NOTE: must solve angular circular dependency issue
        // if (isModel(model)) {
        if (model && model.getQueryParams) {
          dynamicQueryParams = model.getQueryParams();
        }
        // Query params
        params.params = _.extend({}, dynamicQueryParams, params.params);

        // Ensure that we have the appropriate request data.
        if (options.data == null && model && _.include(['POST', 'PUT', 'PATCH'], method)) {
          params.headers['content-type'] = 'application/json';
          params.data = JSON.stringify(options.attrs || model.toJSON(options));
        }

        // If no cache specified we going to use a default value
        if (!params.hasOwnProperty('cache')) {
          params.cache = this.change;
        }

        params.transformResponse = this.$transformResponse;
        params.transformRequest = this.$transformRequest;

        options.success = options.success || angular.noop;
        options.error = options.error || angular.noop;

        return $http(params)
          .success(options.success)
          .error(options.error);
      },

      /**
       * @var BaseSyncClass#cache
       * @description If true, a default $http cache will be used to cache the GET request
       * @type {Boolean}
       */
      cache: {value: false, writable: true},

      /**
       * @function BaseSyncClass#transformResponse
       * @description A transform function or an array of such functions.
       *              The transform function takes the http response body,
       *              headers and status and returns its transformed (typically deserialized)
       *              version.
       * @param  {Object|Array} data  A response object or an array
       * @param  {Object} headers Headers getter
       * @param  {Object} status  A status that server respond with
       * @return {Object} A transformed response
       */
      $transformResponse: function $transformResponse(data) {
        return data;
      },

      /**
       * @function BaseSyncClass#$transformResponse
       * @description Transform response function
       * @param  {Object} data A request data
       * @return {Object}  A transformed request
       */
      $transformRequest: function $transformRequest(data){
        return data;
      }
    }, {extend: Extend});
  }];
});

'use strict';

angular.module('angular.models.config', [])
.constant('MODELS_CONFIG',(function configBuilder(){
  var factory = {

  };

  factory.getUrl = function(key) {
    return this.ENDPOINT_PREFIX + this[key];
  };
  return factory;
})());

'use strict';

angular.module('angular.models')

.factory('BaseExceptionClass', ['Extend', function(Extend) {
  function BaseExceptionClass (message) {
    this.name = 'Exception';
    this.message = message;
  }
  BaseExceptionClass.extend = Extend;
  return BaseExceptionClass;
}])

.factory('ValidationExceptionClass', ['BaseExceptionClass', function (BaseExceptionClass) {
  /**
   * @class ValidationException
   * @description Represents the exception that occurs during validation of a data field
   * @augments Error
   * @param {string} message An error message
   */
  return BaseExceptionClass.extend({});
}]);

'use strict';

angular.module('angular.models')

.factory('Extend', ['_', function (_) {
  function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function isDescriptor(obj) {
    return _.isObject(obj) && (hasProperty(obj, 'value') || hasProperty(obj, 'get') || hasProperty(obj, 'set'));
  }

  function defineGetter (obj, key) {
    obj.get = function () {
      return this.$get(key);
    };
  }

  function defineSetter(obj, key) {
    obj.set = function (value) {
      this.$set(key, value);
    };
  }

  /**
   * @class Extend
   *
   * @example <caption>To make a plain object extendable</caption>
   * var Base;
   * var Person;
   *
   * Base = function (name) {
   *   this._name = name;
   * };
   * Base.extend = Extend;
   *
   * Person = Base.extend({
   *   printName: function () {
   *     return this._name;
   *   }
   * });
   *
   * var person = new Person('Eugene');
   * person.printName(); //-> Eugene
   *
   */
  function Extend (proto, statics) {
    var parent = this;
    var child;
    var properties = {};
    var $$properties;

    if (proto && hasProperty(proto, 'constructor')) {
      child = typeof proto.constructor === 'object' ? proto.constructor.value : proto.constructor;
    } else {
      child = function() { return parent.apply(this, arguments); };
      proto.constructor = child;
    }

    // Properties declared by a user
    $$properties = _.extend({}, proto.$$properties);
    delete proto.$$properties;

    _.each($$properties, function (propValue, propName){
      if (typeof propValue === 'string') {
        var getter = propValue.indexOf('get;') !== -1;
        var setter = propValue.indexOf('set;') !== -1;

        properties[propName] = {};
        getter && defineGetter(properties[propName], propName);
        setter && defineSetter(properties[propName], propName);
      }
    });

    _.each(proto, function(propValue, propName) {
      var descriptor = propValue;

      if (!isDescriptor(descriptor)) {
        descriptor = {value: descriptor};
      }

      if (typeof descriptor.value === 'function') {
        descriptor.writable = true;
      }

      properties[propName] = descriptor;
    });

    child.prototype = Object.create(parent.prototype, properties);

    child.__super__ = parent.prototype;
    child.typeOf = function(obj) {return obj instanceof parent;};
    child.extend = Extend;

    if (!_.isEmpty(statics)) {
      _.each(statics, function (value, key) {
        Object.defineProperty(child, key, {value:value});
      });
    }

    return child;
  }

  return Extend;
}]);

'use strict';

angular.module('angular.models')

.factory('isModel', ['BaseModelClass', function (BaseModelClass){
  'use strict';
  return function isModel(obj) {
    return obj instanceof BaseModelClass;
  };
}])

.factory('WrapError', ['_', function (_) {
  'use strict';
  // Wrap an optional error callback with a fallback error event.
  function WrapError (model, reject, options) {
    // Arguments: xhr, textStatus, errorThrown
    options.error = function () {
      var args = [].concat([model], _.toArray(arguments));
      if (model) {
        model.trigger.apply(model, [].concat(['error'], args));
      }
      var argsObj = _.zipObject(['model', 'xhr', 'textStatus', 'error'], args);
      if (reject) {
        reject(argsObj);
      }
    };
  }

  return WrapError;
}]);

'use strict';

angular.module('angular.models')

// Lodash reference
.factory('_', function () {
  'use strict';
  return window._;
});
})(window, window.angular);