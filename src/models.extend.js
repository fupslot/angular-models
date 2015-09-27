'use strict';

angular.module('angular.models')

.factory('Extend', function (_) {
  function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function isDescriptor(obj) {
    return _.isObject(obj) && (hasProperty(obj, 'value') || hasProperty(obj, 'get') || hasProperty(obj, 'set'));
  }

  function declare(proto, propName) {
    var chain;
    var descriptor;

    function getDescriptor() {
      if (!descriptor) {
        descriptor = proto[propName] = {};
      }
      return descriptor;
    }

    function defineDescriptorPropertySetter(propName) {
      return function(value) {
        getDescriptor()[propName] = (value == null) ? true : value;
      };
    }
    // NOTE: Find an elegant solution to create a descriptor on demand
    chain = {
      getter: function(){
        getDescriptor().get = function() {
          return this.$get(propName);
        };
        return chain;
      },
      setter: function(){
        getDescriptor().set = function(value) {
          this.$set(propName, value);
        };
        return chain;
      },
      value: function(value) {
        getDescriptor().value = value;
        return chain;
      },
      writable: defineDescriptorPropertySetter('writable'),
      enumerable: defineDescriptorPropertySetter('enumerable'),
      configurable: defineDescriptorPropertySetter('configurable')
    };
    return chain;
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

    _.each($$properties, function (value, property){
      if (typeof value === 'string') {
        var getter = value.indexOf('get;') !== -1;
        var setter = value.indexOf('set;') !== -1;
        var descriptor = declare(properties, property);

        getter && descriptor.getter();
        setter && descriptor.setter();
      }
    });

    _.each(proto, function(value, key) {
      properties[key] = isDescriptor(value) ? value : {value: value};
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
});
