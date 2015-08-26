describe('BaseCollectionClass', function () {
  'use strict';
  var $httpBackend;
  var BaseModelClass;
  var BaseCollectionClass;
  var Person;
  var Persons;

  beforeEach(module('angular.models'));

  beforeEach(inject(function(_$httpBackend_, _BaseModelClass_, _BaseCollectionClass_){
    $httpBackend = _$httpBackend_;
    BaseModelClass = _BaseModelClass_;
    BaseCollectionClass = _BaseCollectionClass_;
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


  xit('should be inherited from BaseSyncClass', function(){

  });

  describe('populating collection', function(){
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
      expect(person.get('name')).toEqual('Eugene');
      expect(BaseModelClass.typeOf(person)).toBeTruthy();
    });

    xit('\'parse\' property can be also define as a string', function(){

    });
  });
});