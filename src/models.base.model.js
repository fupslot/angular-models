'use strict';

/** @namespace Core/Models */

angular.module('angular.models')

.factory('BaseModelClass', function ($q, $parse, Extend, Sync, WrapError, ValidationException, _) {

  var proto;

  /**
   * Throw a change event.
   * @fires BaseModelClass#change
   * @memberOf Core/Models
   */

  /**
   * Throw a sync event.
   * @fires BaseModelClass#sync
   * @memberOf Core/Models
   */

  /**
   * Throw a fetched event.
   * @fires BaseModelClass#fetched
   * @memberOf Core/Models
   */

  /**
   * Throw a destroy event.
   * @fires BaseModelClass#destroy
   * @memberOf Core/Models
   */

   /**
   * Throw a invalid event.
   * @fires BaseModelClass#invalid
   * @memberOf Core/Models
   */

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
   *       return this.get('title');
   *     },
   *     set: function(value) {
   *       this.set('title', value);
   *     },
   *     enumerable: true
   *   }
   * });
   *
   * var book = new Book({title: 'Sherlock Holmes'});
   * console.log(book.title); //-> Sherlock Holmes
   * @memberOf Core/Models
   */
  function BaseModelClass (attributes, options) {
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


  proto = BaseModelClass.prototype = Object.create(Sync.prototype);

  /**
   * @member {Object} BaseModelClass#defaultQueryParams
   * @description A hash of query parameters.
   * @memberOf Core/Models
   *
   * @example <caption>Define a custom model with a set of query params</caption>
   * var MyModel = BaseModelClass.extend({
   *   urlRoot: {value: '/api/models'},
   *   paramSort: {
   *     value: function () {
   *       // this - reference to a current model's instance
   *       if (this.get('sort') === true) {
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
   * myModel.set('sort', true);
   * myModel.fetch(); //-> GET /api/models/1?id=1&type=single&sort=abc
   */
  Object.defineProperty(proto, 'defaultQueryParams', {
    value: {}
  });

  /**
   * @member {object} BaseModelClass#changed
   * @description A hash of attributes whose current and previous value differ.
   * @type {object}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'changed', {
    value: null,
    writable: true
  });


  /**
   * @member {object} BaseModelClass#validationError
   * @description The value returned during the last failed validation.
   * @type {object}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'validationError', {
    value: null,
    writable: true
  });


  /**
   * @member {string} BaseModelClass#idAttribute
   * @description The default name for the JSON `id` attribute is `"id"`. MongoDB and
   *              CouchDB users may want to set this to `"_id"`.
   * @type {string}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'idAttribute', {
    value: 'id',
    writable: true
  });


  /**
   * @function BaseModelClass#initialize
   * @description Initialize is an empty function by default. Override it with your own
   *              initialization logic.
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'initialize', {
    value: _.noop,
    writable: true
  });


  /**
   * @member {array} BaseModelClass#serializeModel
   * @description Holds a list of models which will be included into the model when method 'toJSON' called
   * @type {array}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'serializeModel', {
    value: [],
    writable: true
  });


  /**
   * @function BaseModelClass#toJSON
   * @description  Return a copy of the model's `attributes` object.
   * @return {JSON}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'toJSON', {
    value: function toJSON () {
      var self = this;
      var obj = _.cloneDeep(this.attributes);

      if (_.isArray(this.serializeModel) && this.serializeModel.length) {
        _.each(this.serializeModel, function (key) {
          obj[key] = ('toJSON' in self[key]) ? self[key].toJSON() : null;
        });
      }

      return obj;
    }
  });


  /**
   * @function BaseModelClass#get
   * @description Get the value of an attribute.
   * @param {string} attr A field name
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'get', {
    value: function get (attr) {
      // NOTE: Improve
      // if field name has a dot use $parse othewise return a value from attributes
      var getter = $parse(attr);
      return getter(this.attributes);
    }
  });


  /**
   * @function BaseModelClass#is
   * @param  {string} attr A field name
   * @return {boolean} Returns true if a given field exists in a current instance of BaseModelClass
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'is', {
    value: function is (attr) {
      return !!this.attributes[attr];
    }
  });


  /**
   * @function BaseModelClass#has
   * @description Returns `true` if the attribute contains a value that is not null
   *              or undefined.
   * @param  {string} attr
   * @return {boolean}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'has', {
    value: function has (attr) {
      return this.get(attr) != null;
    }
  });

  /**
   * @function BaseModelClass#set
   * @description Set a hash of attributes (one or many) on the model.
   *              If any of the attributes change the model's state, a "change" event
   *              will be triggered on the model. Change events for specific attributes
   *              are also triggered, and you can bind to those as well,
   *              for example: change:title, and change:content. You may also pass individual keys and values.
   * @return {BaseModelClass} Return a reference on a current instance of BaseModelClass
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'set', {
    value: function set (key, val, options) {
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
    }
  });


  /**
   * @function BaseModelClass#unset
   * @description Remove an attribute from the model, firing `"change"`. `unset` is a noop
   *              if the attribute doesn't exist.
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'unset', {
    value: function unset (attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    }
  });


  /**
   * @function BaseModelClass#clear
   * @description Clear all attributes on the model, firing `"change"`.
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'clear', {
    value: function clear (options) {
      var attrs = {};
      for (var key in this.attributes) {
        attrs[key] = void 0;
      }
      return this.set(attrs, _.extend({}, options, {unset: true}));
    }
  });

  /**
   * @function BaseModelClass#hasChange
   * @description Determine if the model has changed since the last `"change"` event.
   *              If you specify an attribute name, determine if that attribute has changed.
   * @param  {string} attr
   * @return {boolean}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'hasChanged', {
    value: function hasChanged (attr) {
      if (attr == null) {
        return !_.isEmpty(this.changed);
      }
      return _.has(this.changed, attr);
    }
  });


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
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'changedAttributes', {
    value: function changedAttributes (diff) {
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
    }
  });


  /**
   * @function BaseModelClass#previuos
   * @description Get the previous value of an attribute, recorded at the time the last
   *              `"change"` event was fired.
   * @param  {string} attr
   * @return {mix}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'previous', {
    value: function previous (attr) {
      if (attr == null || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    }
  });


  /**
   * @function BaseModelClass#previousAttributes
   * @description Get all of the attributes of the model at the time of the previous
   *              <code>change</code> event.
   * @return {object}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'previousAttributes', {
    value: function previousAttributes () {
      return _.clone(this._previousAttributes);
    }
  });


  /**
   * @function BaseModelClass#url
   * @description Default URL for the model's representation on the server -- if you're
   *              using Backbone's restful methods, override this to change the endpoint
   *              that will be called.
   * @return {string}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'url', {
    value: function url () {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');

      if (base == null) {
        throw new Error('A "url" property or function must be specified');
      }

      if (this.isNew()) {
        return base;
      }
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    }
  });


  /**
   * @function BaseModelClass#clone
   * @description Creates a new model with identical attributes to this one.
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'clone', {
    value: function clone () {
      return new this.constructor(this.attributes);
    }
  });

  /**
   * @function BaseModelClass#isNew
   * @description A model is new if it has never been saved to the server, and lacks an id.
   * @return {boolean}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'isNew', {
    value: function isNew () {
      return !this.has(this.idAttribute);
    }
  });


  /**
   * @function BaseModelClass#isValid
   * @description Check if the model is currently in a valid state.
   * @return {boolean}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'isValid', {
    value: function isValid (options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    }
  });


  /**
   * @function BaseModelClass#parse
   * @return {object}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'parse', {
    value: function parse (response) {
      return response;
    }
  });


  /**
   * @function BaseModelClass#save
   * @return {Promise}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'save', {
    value: function save (options) {
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
    }
  });


  /**
   * @function BaseModelClass#fetch
   * @description Fetch the document from the server.
   * @return {Promise}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'fetch', {
    value: function fetch (options) {
      var model = this;
      options = _.extend({}, options);

      return $q(function (resolve, reject) {
        options.success = function (response) {
          if (!model.set(model.parse(response))) {
            return reject(response);
          }
          model.trigger('fetched', model, response);
          resolve(model);
        };
        WrapError(model, reject, options);
        model.sync('GET', model, options);
      });
    }
  });


  /**
   * @function BaseModelClass#destroy
   * @description Destroy this model on the server if it was already persisted.
   * @return {Promise}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'destroy', {
    value: function destroy (options) {
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
        model.sync('DELETE', model, options);
      });
    }
  });


  /**
   * @function BaseModelClass#remove
   * @description Removes a model from a collection if it was exist
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'remove', {
    value: function remove (options) {
      if (!this.collection) {
        return;
      }
      this.collection.remove(this, options);
    }
  });


  /**
   * @function BaseModelClass#setQueryParam
   * @param  {String} key    A parameter's name
   * @param  {Mix} value     A parameter's value
   * @memberOf BaseModelClass
   */
  Object.defineProperty(proto, 'setQueryParam', {
    value: function (key, value) {
      if (value != null) {
        this.defaultQueryParams[key] = value;
      }
      else {
        delete this.defaultQueryParams[key];
      }
    }
  });

  /**
   * @function BaseModelClass#getQueryParams
   * @description Returns a key-value object which containing a query parameters
   * @param {Object} params A hash of query parameters. If any matches found then a default set will overridden.
   * @return {Object}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, 'getQueryParams', {
    value: function getQueryParams (params) {
      var values = {};
      params = params || {};
      _.each(this.defaultQueryParams, function(value, key) {
        if (_.startsWith(value, '@')) {
          values[key] = this.get(_.trimLeft(value, '@'));
        }
        else if (_.startsWith(value, '=')) {
          values[key] = _.result(this, _.trimLeft(value, '='), null);
        }
        else {
          values[key] = value;
        }
      }, this);

      return _.extend({}, values, params);
    }
  });

  /**
   * @function BaseModelClass#_validate
   * @private
   * @description Run validation against the next complete set of model attributes,
   *              returning `true` if all is well. Otherwise, fire an `"invalid"` event.
   * @return {boolean}
   * @memberOf Core/Models
   */
  Object.defineProperty(proto, '_validate', {
    value: function _validate (attrs, options) {
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

  /**
   * @event BaseModelClass#change
   * @description Occured when one ore many attributes set on the model by using {@link: BaseModelClass#set}.
   *              You can also monitor a change event for specific attributes, for example:
   *              change:title (where title is an attribute)
   * @param {BaseModelClass} model A model
   * @param {mix} changed a changed value
   * @param {object} options An options
   * @memberOf Core/Models
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
   * @memberOf Core/Models
   */

   // This will make a BaseModeClass is extendable
  BaseModelClass.extend = Extend;

  return BaseModelClass;
});
