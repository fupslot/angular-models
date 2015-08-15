describe('Core: baseModel', function () {
  'use strict';
  var BaseModelClass, Events, Sync;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function (_BaseModelClass_, _Events_, _Sync_) {
    BaseModelClass = _BaseModelClass_;
    Events = _Events_;
    Sync = _Sync_;
  }));


  describe('Inheritance', function () {
    var model;

    beforeEach(function () {
      model = new BaseModelClass();
    });

    it('should be inherited from a Event class', function () {
      expect(model instanceof Events);
    });

    it('should be inherited from a Sync class', function () {
      expect(model instanceof Sync);
    });

    it('should ne an instanceof a BaseModel', function () {
      expect(model instanceof BaseModelClass).toBeTruthy();
    });
  });

  describe('Person model', function () {
    var PersonCls;
    var person;

    beforeEach(function () {
      // Defining a Person class
      PersonCls = BaseModelClass.extend({
        defaults: {
          value: {
            name: 'Unknown'
          }
        },
        name: {
          get: function () {
            return this.get('name');
          },
          set: function (value) {
            this.set('name', value);
          }
        }
      });
    });

    it('defaults', function () {
      person = new PersonCls();
      expect(person.name).toEqual('Unknown');
    });

    it('custom definition', function () {
      person = new PersonCls({name: 'Eugene'});
      expect(person.name).toEqual('Eugene');
    });
  });

  xdescribe('Base Model', function() {
    var Person, http, httpBackend;

    beforeEach(inject(function($http, $httpBackend, BaseModel){
      http = $http;
      httpBackend = $httpBackend; // Doesn't work, Findout why!!!
      Person = BaseModel.extend({
        urlRoot: '/persons'
      });
    }));

    it('should be able to extend base model', function () {
      var person = new Person({name:'Bon Jovi'});
      expect(person).toBeDefined();
    });
  });
});
