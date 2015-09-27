'use strict';

angular.module('angular.models')

.factory('BaseCollectionClass', function ($q, BaseSyncClass, BaseModelClass, WrapError, _) {

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
});
