describe('BaseClass', function () {
  'use strict';
  var BaseClass;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseClass_){
    BaseClass = _BaseClass_;
  }));

  it('use a constructor', function() {
    var Person = BaseClass.extend({
      constructor: function(name) {
        this._name = name;
      },
      name: {
        get: function() {
          return this._name;
        }
      }
    });
    var person = new Person('Eugene');
    expect(person instanceof Person);
    expect(person instanceof BaseClass);
    expect(person.name).toEqual('Eugene');
  });

  it('typeOf', function(){
    var CustomClass = BaseClass.extend({});
    var customClass = new CustomClass();
    expect(BaseClass.typeOf(customClass)).toBeTruthy();
  });
});
