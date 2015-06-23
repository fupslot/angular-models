describe('Core: baseModel', function () {
  'use strict';

  // load the directive's module and view
  beforeEach(module('angular.models'));

  var scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  describe('Base Model', function() {
    var Person, http, httpBackend;

    beforeEach(inject(function($http, $httpBackend, BaseModel){
      http = $http;
      httpBackend = $httpBackend;
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