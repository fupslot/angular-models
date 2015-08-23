describe('BaseClass', function () {
  'use strict';
  var BaseClass;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseClass_){
    BaseClass = _BaseClass_;
  }));

  describe('be able to extend BaseClass', function(){
    var MyClass;

    beforeEach(function(){
      MyClass = BaseClass.extend({
        constructor: function(attrs) {
          this.className = 'MyClass';
          this.attributes = attrs;
        }
      });
    });

    it('use a constructor', function() {
      var myClass = new MyClass({item: 'Table'});
      expect(myClass instanceof MyClass);
      expect(myClass instanceof BaseClass);
      expect(myClass.className).toEqual('MyClass');
      expect(myClass.attributes).toBeDefined();
    });
  });
});
