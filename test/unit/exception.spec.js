describe('Exceptions', function () {
  'use strict';
  var BaseExceptionClass;
  var ValidationExceptionClass;
  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseExceptionClass_, _ValidationExceptionClass_){
    BaseExceptionClass = _BaseExceptionClass_;
    ValidationExceptionClass = _ValidationExceptionClass_;
  }));

  it('be able to inherit from BaseExceptionClass', function(){
    var exception  = new ValidationExceptionClass('Error');
    expect(exception instanceof BaseExceptionClass).toBeTruthy();
    expect(exception.message).toEqual('Error');
  });
});
