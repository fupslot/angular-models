describe('BaseModelClass', function () {
  'use strict';

  var $httpBackend;
  var BaseModelClass, Events, Sync;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function (_BaseModelClass_, _BaseEventClass_, _BaseSyncClass_, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    BaseModelClass = _BaseModelClass_;
    Events = _BaseEventClass_;
    Sync = _BaseSyncClass_;
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
            return this.$get('title');
          },
          set: function(value) {
            this.$set('title', value);
          },
          enumerable: true
        }
      });
    });

    it('default definition', function () {
      book = new BookCls();
      expect(book.$get('title')).toEqual('Untitled book');
    });

    it('custom definition', function () {
      book = new BookCls({title: 'Sherlock Holmes'});
      expect(book.$get('title')).toEqual('Sherlock Holmes');
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
    var responseSpy;

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
      expect(person.$get('id')).toEqual(1);
      expect(person.$get('name')).toEqual('Eugene');
    });

    it('should be able to save a model', function () {
      $httpBackend.expectPUT('/persons/1')
        .respond({id: 1, name: 'Eugene Brodsky'});

      var person = new Person({id: 1, name: 'Eugene'});
      expect(person.$get('name')).toEqual('Eugene');
      person.$set('name', 'Eugene Brodsky');
      person.save();

      $httpBackend.flush();
      expect(responseSpy).toHaveBeenCalled();
      expect(person.$get('name')).toEqual('Eugene Brodsky');
    });

    describe('query params', function() {

      it('over the fetch function', function () {
        var person = new Person();
        $httpBackend.expectGET('/persons/1?id=1')
          .respond({id: 1, name: 'Eugene'});

        person.$set('id', 1);
        person.fetch({params: {id: 1}});
        $httpBackend.flush();

        expect(person.$get('name')).toEqual('Eugene');
      });

      it('over the save function', function(){
        var person = new Person();
        $httpBackend.expectPOST('/persons?a=a&b=b')
          .respond({id: 1, name: 'Eugene'});

        person.save({params: {a: 'a', b: 'b'}});
        $httpBackend.flush();
        expect(person.$get('name')).toEqual('Eugene');
      });

      it('over the destroy function', function(){
        var person = new Person();
        $httpBackend.expectDELETE('/persons/1?a=a&b=b')
          .respond(204, '');

        // Pretends that an instance of a Person class has some data
        person.$set('id', 1);

        person.destroy({params: {a: 'a', b: 'b'}});
        $httpBackend.flush();
        expect(person.$get('name')).toBeUndefined();
      });

      describe('should be able to', function(){
        var myModel, MyModel;

        beforeEach(function(){
          MyModel = BaseModelClass.extend({
            urlRoot: {value: '/api/models'},
            defaultQueryParams: {
              value: {
                // Symbol '@' tells to a model to extract
                // a parameter's value from a model's attribute set
                'id': '@id',
                // Defining a static parameter 'type' with a value 'single'
                'type': 'single',
                // Defining a dynamic parameter 'sort' with a custom logic
                'sort': '=paramSort'
              }
            },
            paramSort: {
              value: function() {
                if (this.$get('sort') === true) {
                  return 'abc';
                }
                else {
                  return 'desc';
                }
              }
            }
          });
        });

        beforeEach(function(){
          myModel = new MyModel({id: 1});
        });

        it('get pre-defined query parameters', function(){
          var params = myModel.getQueryParams();
          expect(params.id).toEqual(1);
          expect(params.type).toEqual('single');
          expect(params.sort).toEqual('desc');
          myModel.$set('sort', true);
          params = myModel.getQueryParams();
          expect(params.sort).toEqual('abc');
        });

        it('override pre-defined query parameters', function() {
          var defaults = {sort: true, id: 2, type: null};
          var params = myModel.getQueryParams(defaults);
          expect(params.id).toEqual(2);
          expect(params.type).toEqual(null);
          expect(params.sort).toEqual(true);
        });

        it('set a query parameter by calling setQueryParam method', function(){
          var params;
          // Sets a dynamic query parameter
          myModel.setQueryParam('name', '@name');
          params = myModel.getQueryParams();
          expect(params.name).toBeUndefined();
          // Sets a static query parameter
          myModel.$set('name', 'Eugene');
          params = myModel.getQueryParams();
          expect(params.name).toEqual('Eugene');
          // Sets a dynamic query parameter
          myModel.setQueryParam('exec', '=paramSort');
          params = myModel.getQueryParams();
          expect(params.exec).toEqual('desc');
        });

        it('uset a query parameter by calling setQueryParam method', function(){
          var params;
          myModel.setQueryParam('id', null);
          params = myModel.getQueryParams();
          expect(params.id).toBeUndefined();
        });

        it('fetch a model data with pre-defined query parameters', function() {
          $httpBackend.expectGET('/api/models/1?id=1&sort=desc&type=single')
            .respond({id: 1, name: 'Eugene'});
          myModel.fetch();
          $httpBackend.flush();
          expect(myModel.$get('name')).toEqual('Eugene');
        });

        it('fetch a model data with overridden pre-defined query parameters', function(){
          $httpBackend.expectGET('/api/models/1?id=2&sort=desc&type=single')
            .respond({id: 1, name: 'Eugene'});
          myModel.fetch({params: {id: 2}});
          $httpBackend.flush();
          expect(myModel.$get('name')).toEqual('Eugene');
        });
      });
    });
  });

  it('declare getters and setters', function(){
    var Model = BaseModelClass.extend({
      $$properties: {
        title: 'get; set;',
        name: 'get;'
      },
      displayName: {
        get: function displayName() {
          return this.name;
        }
      }
    });
    var model = new Model({name: 'Eugene', title: ''});
    expect(model.title).toBeDefined();
    expect(model.name).toBeDefined();
    model.title = 'Developer';
    expect(model.title).toEqual('Developer');
    try { model.name = 'Oshri'; }
    catch(e) { expect(model.name).toEqual('Eugene'); }
    expect(model.displayName).toEqual('Eugene');
  });

  it('\'parse\' as function', function(){
    var Model = BaseModelClass.extend({ parse: function (data) { return data.data; } });
    var attrs = {data: {id: 1, name: 'Eugene'}};
    var model = new Model(attrs, {parse: true});
    expect(model.id).toEqual(1);
    expect(model.$get('name')).toEqual('Eugene');
  });

  it('\'parse\' as string', function() {
    var Model = BaseModelClass.extend({ parse: 'data' });
    var attrs = {data: {id: 1, name: 'Eugene'}};
    var model = new Model(attrs, {parse: true});
    expect(model.id).toEqual(1);
    expect(model.$get('name')).toEqual('Eugene');
  });
});
