angular.module('angular.models.exception.validation', [])
  .factory('ValidationException', function () {
    'use strict';

    /**
     * @class ValidationException
     * @description Represents the exception that occurs during validation of a data field
     * @augments Error
     * @param {string} message An error message
     */
    function ValidationException (message) {
      this.name = 'ValidationError';
      this.message = message;
    }

    ValidationException.prototype = Object.create(Error.prototype);
    ValidationException.prototype.constructor = ValidationException;

    return ValidationException;
  });
