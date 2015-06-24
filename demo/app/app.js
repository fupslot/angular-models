angular.module('myApp', ['angular.models', 'ngMockE2E'])
  .factory('PersonModel', function(BaseModel){
    return BaseModel.extend({
      urlRoot: '/persons'
    });
  })

  .factory('PersonCollection', function(BaseCollection, PersonModel){
    return BaseCollection.extend({
      url: '/persons',
      model: PersonModel
    });
  })

  .service('Persons', function(PersonCollection) {
    return new PersonCollection();
  })

  .controller('appCtrl', function (Persons, $httpBackend, $http) {
    'use strict';

    $httpBackend
      .when('GET', '/persons')
      .respond([{id:1, name:'Bon Jovi'}]);

    $httpBackend
      .when('POST', '/persons')
      .respond({id:2, name:'Richie'});

    $httpBackend
      .when('DELETE', /\/persons\/\d/)
      .respond(204, '');
    $httpBackend
      .when('PUT', /\/persons\/\d/)
      .respond(200, {id: 1, name:'Bon Jovi2'});

    var ctrl = this;
    ctrl.model = {};

    ctrl.persons = Persons;

    ctrl.persons.fetch().then(function(persons){
      console.log(persons);
    });

    ctrl.persons.create({name:'Richie'});

    ctrl.destroyFirst = function() {
      var p = ctrl.persons.first();
      p.destroy();
    };

    ctrl.formSubmit = function formSubmit() {
      ctrl.persons.add(ctrl.model);
    };
  });