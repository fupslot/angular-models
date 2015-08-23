'use strict';

angular.module('angular.models')

.factory('BaseExceptionClass', function(Extend) {
  function BaseExceptionClass (message) {
    this.name = 'Exception';
    this.message = message;
  }
  BaseExceptionClass.extend = Extend;
  return BaseExceptionClass;
})

.factory('ValidationExceptionClass', function (BaseExceptionClass) {
  /**
   * @class ValidationException
   * @description Represents the exception that occurs during validation of a data field
   * @augments Error
   * @param {string} message An error message
   */
  return BaseExceptionClass.extend({});
});
