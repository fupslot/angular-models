describe('Core: BaseModelClass', function () {
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
    var BookCls;
    var book;

    beforeEach(function () {
      // Defining a Person class
      BookCls = BaseModelClass.extend({
        'defaults': {
          value: {
            title: 'Untitled book'
          }
        },

        constructor: {
          value: function () {
            // do somethig before the super class constructor call

            // Call the super class constructor
            BaseModelClass.apply(this, arguments);

            // do somethig after the super class constructor call
          }
        },

        title: {
          get: function () {
            return this.get('title');
          },
          set: function(value) {
            this.set('title', value);
          },
          enumerable: true
        }
      });
    });

    it('default definition', function () {
      book = new BookCls();
      expect(book.get('title')).toEqual('Untitled book');
    });

    it('custom definition', function () {
      book = new BookCls({title: 'Sherlock Holmes'});
      expect(book.get('title')).toEqual('Sherlock Holmes');
    });

    it('use custom accessors', function () {
      book = new BookCls();
      expect(book.title).toEqual('Untitled book');
      book.title = 'Sherlock Holmes';
      expect(book.title).toEqual('Sherlock Holmes');
    });
  });

  describe('Base Model', function() {
    var Person;
    var $httpBackend;
    var BaseModelClass;
    var responseSpy;

    beforeEach(inject(function(_$httpBackend_, _BaseModelClass_){
      $httpBackend = _$httpBackend_;
      BaseModelClass = _BaseModelClass_;
    }));

    beforeEach(function () {
      responseSpy = jasmine.createSpy('responseSpy');

      Person = BaseModelClass.extend({
        urlRoot: {
          value: '/persons'
        },
        parse: {
          value: function (response) {
            responseSpy();
            return response;
          }
        }
      });
    });

    it('should be able to fetch a model from the server', function () {
      $httpBackend.expectGET('/persons/1')
        .respond({id: 1, name: 'Eugene'});

      var person = new Person({id: 1});
      person.fetch();
      $httpBackend.flush();

      expect(responseSpy).toHaveBeenCalled();
      expect(person.get('id')).toEqual(1);
      expect(person.get('name')).toEqual('Eugene');
    });

    it('should be able to save a model', function () {
      $httpBackend.expectPUT('/persons/1')
        .respond({id: 1, name: 'Eugene Brodsky'});

      var person = new Person({id: 1, name: 'Eugene'});
      expect(person.get('name')).toEqual('Eugene');
      person.set('name', 'Eugene Brodsky');
      person.save();

      $httpBackend.flush();
      expect(responseSpy).toHaveBeenCalled();
      expect(person.get('name')).toEqual('Eugene Brodsky');
    });
  });
});
