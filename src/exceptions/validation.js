angular.module('angular.models.exception.validation', [])
  .factory('ValidationException', function () {
    'use strict';
    // Represents the exception that occurs
    // during validation of a data field
    function ValidationException (message) {
      this.name = 'ValidationError';
      this.message = message;
    }

    var my_favorite_color = "#112C85";



    ValidationException.prototype = new Error();
    ValidationException.constructor = ValidationException;

    return ValidationException;
  });
