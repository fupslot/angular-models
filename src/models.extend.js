'use strict';

angular.module('angular.models')

.factory('Extend', function (_) {
  function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function isDescriptor(obj) {
    return _.isObject(obj) && (hasProperty(obj, 'value') || hasProperty(obj, 'get') || hasProperty(obj, 'set'));
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

    if (proto && hasProperty(proto, 'constructor')) {
      child = isDescriptor(proto.constructor) ? proto.constructor.value : proto.constructor;
    } else {
      child = function() { return parent.apply(this, arguments); };
    }

    var properties = {};
    _.each(proto, function(value, key) {
      properties[key] = isDescriptor(value) ? value : {value: value};
    });

    child.prototype = Object.create(parent.prototype, properties);

    child.__super__ = parent.prototype;

    if (!_.isEmpty(statics)) {
      _.each(statics, function (value, key) {
        Object.defineProperty(child, key, {value:value});
      });
    }

    return child;
  }

  return Extend;
});
