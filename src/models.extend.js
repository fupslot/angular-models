'use strict';

angular.module('angular.models')

.factory('Extend', function (_) {

  /**
   * @class Extend
   * @memberOf Core
   *
   * @example <caption>To make a plain object extendable</caption>
   * var Base;
   * var Person;
   *
   * Base = _.noop;
   * Base.extend = Extend;
   *
   * Person = Base.extend({
   *   'print': {
   *     value: function () {
   *       return 'Person';
   *     }
   *   }
   * });
   *
   * var person = new Person();
   *
   */
  function Extend (proto, statics) {
    var parent = this;
    var child;

    if (proto && proto.hasOwnProperty('constructor')) {
      child = proto.constructor.value;
    } else {
      child = function() { return parent.apply(this, arguments); };
    }

    child.prototype = Object.create(parent.prototype, proto);

    child.__super__ = parent.prototype;

    if (!_.isEmpty(statics)) {
      _.each(statics, function (value, key) {
        child[key] = value;
      });
    }

    return child;
  }

  return Extend;
});
