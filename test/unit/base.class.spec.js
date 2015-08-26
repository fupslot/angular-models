describe('BaseClass', function () {
  'use strict';
  var BaseClass;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseClass_){
    BaseClass = _BaseClass_;
  }));

  describe('be able to extend BaseClass', function(){
    var Person;

    beforeEach(function(){
      Person = BaseClass.extend({
        constructor: function(name) {
          this._name = name;
        },
        name: {
          get: function() {
            return this._name;
          }
        }
      });
    });

    it('use a constructor', function() {
      var person = new Person('Eugene');
      expect(person instanceof Person);
      expect(person instanceof BaseClass);
      expect(person.name).toEqual('Eugene');
    });
  });

  describe('\'typeOf\'', function(){
    var CustomClass;

    beforeEach(function(){
      CustomClass = BaseClass.extend({});
    });

    it('should be able to identify if a given class has relation to a BaseClass', function(){
      var customClass = new CustomClass();
      expect(BaseClass.typeOf(customClass)).toBeTruthy();
    });
  });
});
