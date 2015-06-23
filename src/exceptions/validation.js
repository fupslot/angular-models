angular.module('angular.models.exception.validation', [])
  .factory('ValidationException', function () {

    // Represents the exception that occurs
    // during validation of a data field
    function ValidationException (message) {
      this.name = 'ValidationError';
      this.message = message;
    }

    ValidationException.prototype = new Error();
    ValidationException.constructor = ValidationException;

    return ValidationException;
  });
