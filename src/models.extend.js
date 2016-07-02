'use strict';

angular.module('angular.models')

.factory('Extend', function (lodash) {
  function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function isDescriptor(obj) {
    return lodash.isObject(obj) && (hasProperty(obj, 'value') || hasProperty(obj, 'get') || hasProperty(obj, 'set'));
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

    // This method will be depricated in near feature
    console.warn('angular.models#extend: This method will be depricated in near feature');

    if (proto && hasProperty(proto, 'constructor')) {
      child = typeof proto.constructor === 'object' ? proto.constructor.value : proto.constructor;
    } else {
      child = function() { return parent.apply(this, arguments); };
      proto.constructor = child;
    }

    // Properties declared by a user
    $$properties = lodash.extend({}, proto.$$properties);
    delete proto.$$properties;

    lodash.each($$properties, function (propValue, propName){
      if (typeof propValue === 'string') {
        var getter = propValue.indexOf('get;') !== -1;
        var setter = propValue.indexOf('set;') !== -1;

        properties[propName] = {};
        getter && defineGetter(properties[propName], propName);
        setter && defineSetter(properties[propName], propName);
      }
    });

    lodash.each(proto, function(propValue, propName) {
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

    if (!lodash.isEmpty(statics)) {
      lodash.each(statics, function (value, key) {
        Object.defineProperty(child, key, {value:value});
      });
    }

    return child;
  }

  return Extend;
});
