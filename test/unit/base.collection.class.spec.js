describe('BaseCollectionClass', function () {
  'use strict';
  var $httpBackend;
  var BaseModelClass;
  var BaseSyncClass;
  var BaseCollectionClass;
  var Person;
  var Persons;

  beforeEach(module('angular.models'));

  beforeEach(inject(function(_$httpBackend_, _BaseModelClass_, _BaseCollectionClass_, _BaseSyncClass_){
    $httpBackend = _$httpBackend_;
    BaseModelClass = _BaseModelClass_;
    BaseCollectionClass = _BaseCollectionClass_;
    BaseSyncClass = _BaseSyncClass_;
  }));

  beforeEach(function () {
    Person = BaseModelClass.extend({
      urlRoot: {
        value: '/persons'
      }
    });

    Persons = BaseCollectionClass.extend({
      model: {
        value: Person
      },
      url: {
        value: '/persons'
      }
    });
  });


  it('should be inherited from BaseSyncClass', function(){
    var person = new Person();
    expect(person.typeOf).toBeDefined();
    expect(BaseSyncClass.typeOf(person)).toBeTruthy();
  });

  it('should be able to fetch a collection from a server', function(){
    var persons;
    var person;

    Persons.url = '/fake';

    $httpBackend
      .expectGET('/persons')
      .respond([{id: 1, name: 'Eugene'}]);

    persons = new Persons();
    persons.fetch();
    $httpBackend.flush();

    expect(persons.length).toBe(1);

    person = persons.first();
    expect(person.$get('name')).toEqual('Eugene');
    expect(BaseModelClass.typeOf(person)).toBeTruthy();
  });


  it('\'parse\' as a function', function(){
    var Person = BaseModelClass.extend({});
    var Persons = BaseCollectionClass.extend({
      model: Person,
      url: '/persons',
      parse: function(response) {
        return response.objects;
      }
    });

    $httpBackend
      .expectGET('/persons')
      .respond({objects: [{id: 1, name: 'Eugene'}]});

    var persons = new Persons();
    persons.fetch();
    $httpBackend.flush();

    expect(persons.size()).toEqual(1);
  });

  it('\'parse\' as a string', function(){
    var Person = BaseModelClass.extend({});
    var Persons = BaseCollectionClass.extend({
      model: Person,
      url: '/persons',
      parse: 'objects'
    });

    $httpBackend
      .expectGET('/persons')
      .respond({objects: [{id: 1, name: 'Eugene'}]});

    var persons = new Persons();
    persons.fetch();
    $httpBackend.flush();

    expect(persons.size()).toEqual(1);
  });

  it('clone collection', function () {
    var Model = BaseModelClass.extend({});
    var Collection = BaseCollectionClass.extend({
      customFn: function customFn() { return true; }
    });

    var collection = new Collection([{id: 1}], {model: Model});
    var clone = collection.clone();
    expect(clone.customFn()).toBeTruthy();
  });

  it('be able to spyOn default methods', function () {
    var Collection = BaseCollectionClass.extend({
      customFn: function () { }
    });
    var collection = new Collection();
    spyOn(collection, 'customFn').and.callThrough();
    collection.customFn();
    expect(collection.customFn).toHaveBeenCalled();
  });
});
