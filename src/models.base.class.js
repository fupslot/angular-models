'use strict';

angular.module('angular.models')

.factory('BaseClass', function (Extend) {
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
});
