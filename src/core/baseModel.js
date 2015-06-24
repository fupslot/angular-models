angular.module('angular.models.core.model', ['angular.models.exception.validation', 'angular.models.core.extend', 'angular.models.helper', 'angular.models.core.sync', 'angular.models.core.events'])
  .factory('BaseModel', function ($q, $parse, Events, Extend, Sync, WrapError, ValidationException, _) {
    'use strict';

    // This abstract class represents common methods of a model
    function BaseModel (attributes, options) {
      var attrs = attributes || {};
      options = options || {};
      this.cid = _.uniqueId('c');
      this.attributes = {};

      if (options.parse) {
        attrs = this.parse(attrs, options) || {};
      }
      if (options.collection) {
        this.collection = options.collection;
      }

      attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

      this.set(attrs, options);
      this.changed = {};
      this.initialize.apply(this, arguments);
    }

    _.extend(BaseModel.prototype, Events, {
      // A hash of attributes whose current and previous value differ.
      changed: null,

      // The value returned during the last failed validation.
      validationError: null,

      // The default name for the JSON `id` attribute is `"id"`. MongoDB and
      // CouchDB users may want to set this to `"_id"`.
      idAttribute: 'id',

      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: _.noop,

      // Holds a list of models which will be inluded into the model when method 'toJSON' called
      serializeModel: [],

      // A map associate virtual names with private fiels
      // they will be available over a "get" method
      // Ex: {"_lookups": "lookups"}
      // model.get("lookups");
      // privateFields: {},

      // Return a copy of the model's `attributes` object.
      toJSON: function() {
        var self = this;
        var obj = _.cloneDeep({}, this.attributes);

        if (_.isArray(this.serializeModel) && this.serializeModel.length) {
          _.each(this.serializeModel, function (key) {
            obj[key] = ('toJSON' in self[key]) ? self[key].toJSON() : null;
          });
        }

        return obj;
      },

      // Proxy `Sync` by default -- but override this if you need
      // custom syncing semantics for *this* particular model.
      sync: function() {
        return Sync.apply(this, arguments);
      },

      // Get the value of an attribute.
      get: function(attrPath) {
        var getter = $parse(attrPath);
        return getter(this.attributes);
      },

      is: function (attr) {
        return !!this.attributes[attr];
      },

      // Returns `true` if the attribute contains a value that is not null
      // or undefined.
      has: function(attr) {
        return this.get(attr) != null;
      },

      // Set a hash of model attributes on the object, firing `"change"`. This is
      // the core primitive operation of a model, updating the data and notifying
      // anyone who needs to know about the change in state. The heart of the beast.
      set: function(key, val, options) {
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
        var error = this._validate(attrs, options);
        if (error instanceof ValidationException) {
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

      // Remove an attribute from the model, firing `"change"`. `unset` is a noop
      // if the attribute doesn't exist.
      unset: function(attr, options) {
        return this.set(attr, void 0, _.extend({}, options, {unset: true}));
      },

      // Clear all attributes on the model, firing `"change"`.
      clear: function(options) {
        var attrs = {};
        for (var key in this.attributes) {
          attrs[key] = void 0;
        }
        return this.set(attrs, _.extend({}, options, {unset: true}));
      },

      // Determine if the model has changed since the last `"change"` event.
      // If you specify an attribute name, determine if that attribute has changed.
      hasChanged: function(attr) {
        if (attr == null) {
          return !_.isEmpty(this.changed);
        }
        return _.has(this.changed, attr);
      },

      // Return an object containing all the attributes that have changed, or
      // false if there are no changed attributes. Useful for determining what
      // parts of a view need to be updated and/or what attributes need to be
      // persisted to the server. Unset attributes will be set to undefined.
      // You can also pass an attributes object to diff against the model,
      // determining if there *would be* a change.
      changedAttributes: function(diff) {
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

      // Get the previous value of an attribute, recorded at the time the last
      // `"change"` event was fired.
      previous: function(attr) {
        if (attr == null || !this._previousAttributes) {
          return null;
        }
        return this._previousAttributes[attr];
      },

      // Get all of the attributes of the model at the time of the previous
      // `"change"` event.
      previousAttributes: function() {
        return _.clone(this._previousAttributes);
      },

      // Default URL for the model's representation on the server -- if you're
      // using Backbone's restful methods, override this to change the endpoint
      // that will be called.
      url: function() {
        var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');

        if (base == null) {
          throw new Error('A "url" property or function must be specified');
        }

        if (this.isNew()) {
          return base;
        }
        return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
      },

      // Create a new model with identical attributes to this one.
      clone: function() {
        return new this.constructor(this.attributes);
      },

      // A model is new if it has never been saved to the server, and lacks an id.
      isNew: function() {
        return !this.has(this.idAttribute);
      },

      // Check if the model is currently in a valid state.
      isValid: function(options) {
        return this._validate({}, _.extend(options || {}, { validate: true }));
      },

      parse: function (response) {
          return response;
      },

      save: function(options) {
        options = _.extend({validate: true}, options);
        var model = this;
        var method = model.isNew() ? 'POST' : 'PUT';

        return $q(function (resolve, reject) {
          if (!model.url()) {
            return reject();
          }

          if (!model._validate({}, options)) {
            return reject(model.validationError);
          }

          options.success = function success (response) {
            if (!model.set(model.parse(response))) {
              return reject(response);
            }
            model.trigger('sync', model);
            resolve(model);
          };
          WrapError(model, reject, options);
          model.sync(method, model, options);
        });
      },

      // Fetch the document from the server.
      fetch: function (options) {
        var model   = this;
        options = _.extend({}, options);

        return $q(function (resolve, reject) {
          options.success = function (response) {
              if (!model.set(model.parse(response))) {
                return false;
              }
              model.trigger('fetched', model, response);
              resolve(model);
          };
          WrapError(model, reject, options);
          model.sync('read', model, options);
        });
      },

      // Destroy this model on the server if it was already persisted.
      destroy: function(options) {
        options = options || {};
        var model = this;

        var destroy = function() {
          model.trigger('destroy', model, model.collection, options);
        };

        // var result = Cooladata.Q.defer();
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
          model.sync('DELETE', model, options);
        });
      },

      // Removes a model from a collection if it was exist
      remove: function (options) {
        if (!this.collection) {
          return;
        }
        this.collection.remove(this, options);
      },

      // Run validation against the next complete set of model attributes,
      // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
      _validate: function(attrs, options) {
        if (!options.validate || !this.validate) {
          return true;
        }
        attrs = _.extend({}, this.attributes, attrs);
        var error = this.validationError = this.validate(attrs, options) || null;
        if (!(error instanceof ValidationException)) {
          return true;
        }
        this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
        return false;
      }
    });

    // Making BaseModel extendable over 'extend' method
    BaseModel.extend = Extend;
    return BaseModel;
  });
