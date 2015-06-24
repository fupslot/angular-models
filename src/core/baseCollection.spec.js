describe('Core: BaseCollection', function () {
  'use strict';
  var httpBackend, baseModel, baseCollection;

  angular.module('myApp', ['angular.models', 'ngMockE2E']);
  beforeEach(module('myApp'));

  beforeEach(inject(function($httpBackend, BaseModel, BaseCollection){
    httpBackend = $httpBackend;
    baseModel = BaseModel
    baseCollection = BaseCollection;
  }));

  describe('Initialization', function(){

    it('should be able to extend BaseCollection', function(done){
      httpBackend
        .whenGET('/persons')
        .respond([{id:1, name:'Bon Jovi'}]);

      var Person = baseModel.extend({
        rootUrl: '/persons'
      });

      var Persons = baseCollection.extend({
        url: '/persons',
        model: Person
      });

      var persons = new Persons();
      persons.fetch().then(function(persons){
        expect(persons.length).toBe(1);
        done();
      });
    });
  });
});