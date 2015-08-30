describe('BaseSyncClass', function () {
  'use strict';
  var $httpBackend;



  describe('have an ability to override CRUD method using BaseSyncClassProvider', function(){
    var MyClass;

    // load the directive's module and view
    beforeEach(module('angular.models', function(BaseSyncClassProvider){
      BaseSyncClassProvider.setOperation('read', 'POST');
    }));

    beforeEach(inject(function(_$httpBackend_){
      $httpBackend = _$httpBackend_;
    }));

    beforeEach(inject(function (BaseModelClass) {
      // Defining a Person class
      MyClass = BaseModelClass.extend({
        urlRoot: {
          value: '/api/models'
        }
      });
    }));

    it('default CRUD method', function(){
      var myClass = new MyClass();
      $httpBackend.expectPOST('/api/models')
        .respond(200, {id:1, name: 'Eugene'});

      myClass.fetch();
      $httpBackend.flush();

      expect(myClass.$get('id')).toEqual(1);
      expect(myClass.$get('name')).toEqual('Eugene');
    });
  });

  describe('have an ability to override', function() {
    var MyClass;

    beforeEach(module('angular.models'));

    beforeEach(inject(function(_$httpBackend_){
      $httpBackend = _$httpBackend_;
    }));

    beforeEach(inject(function (BaseModelClass) {
      // Defining a Person class
      MyClass = BaseModelClass.extend({
        urlRoot: {
          value: '/api/models'
        },
        fetch: {
          value: function fetch () {
            var options = {method: 'POST'};
            return BaseModelClass.prototype.fetch.apply(this, [options]);
          }
        }
      });
    }));

    it('fetch makes POST instead GET', function() {
      var myClass = new MyClass();
      $httpBackend.expect('POST', '/api/models')
        .respond(200, {'id': 1, 'name': 'Eugene'});

      myClass.fetch();
      $httpBackend.flush();

      expect(myClass.$get('id')).toEqual(1);
      expect(myClass.$get('name')).toEqual('Eugene');
    });
  });

});
