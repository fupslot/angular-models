describe('Core: BaseCollection', function () {
  'use strict';
  var $httpBackend, Persons;

  beforeEach(module('myApp'));

  beforeEach(inject(function($injector){
    $httpBackend = $injector.get('$httpBackend');
    Persons = $injector.get('Persons');
  }));

  describe('Initialization', function(){
    it('should be able to fetch data', function(){
      $httpBackend
        .expectGET('/persons')
        .respond([{id:1, name:'Bon Jovi'}]);

      Persons.fetch();
      $httpBackend.flush();

      expect(Persons).toBeDefined();
      expect(Persons.length).toBe(1);
    });
  });
});