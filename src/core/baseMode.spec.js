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
      expect(model instanceof Events).toBeTruthy();
    });

    it('should be inherited from a Sync class', function () {
      expect(model instanceof Sync).toBeTruthy();
    });

    it('should be an instanceof a BaseModel', function () {
      expect(model instanceof BaseModelClass).toBeTruthy();
    });
  });

  describe('Extendable', function () {
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

    it('default definition', function () {
      person = new PersonCls();
      expect(person.get('name')).toEqual('Unknown');
    });

    it('custom definition', function () {
      person = new PersonCls({name: 'Eugene'});
      expect(person.get('name')).toEqual('Eugene');
    });

    it('use custom accessors', function () {
      person = new PersonCls({name: 'Eugene'});
      expect(person.name).toEqual('Eugene');
      person.name = 'Paul';
      expect(person.name).toEqual('Paul');
    });
  });

  describe('Base Model', function() {
    var Person;
    var $httpBackend;
    var BaseModelClass;

    beforeEach(inject(function(_$httpBackend_, _BaseModelClass_){
      $httpBackend = _$httpBackend_;
      BaseModelClass = _BaseModelClass_;
    }));

    beforeEach(function () {
      Person = BaseModelClass.extend({
        urlRoot: {
          value: '/persons'
        }
      });
    });

    it('should be able to fetch a model from the server', function () {
      $httpBackend.expectGET('/persons/1')
        .respond({id: 1, name: 'Eugene'});

      var person = new Person({id: 1});
      person.fetch();
      $httpBackend.flush();

      expect(person.get('id')).toEqual(1);
      expect(person.get('name')).toEqual('Eugene');
    });
  });
});
