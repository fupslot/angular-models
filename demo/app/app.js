angular.module('myApp', ['angular.models'])
  .factory('PersonModel', function(BaseModel){
    return BaseModel.extend({
      urlRoot: '/persons'
    });
  })

  .factory('PersonCollection', function(BaseCollection, PersonModel){
    return BaseCollection.extend({
      model: PersonModel
    });
  })

  .service('Persons', function(PersonCollection) {
    return new PersonCollection();
  })

  .controller('appCtrl', function (Persons) {
    'use strict';

    var ctrl = this;
    ctrl.model = {};

    ctrl.persons = Persons;

    ctrl.formSubmit = function formSubmit() {
      ctrl.persons.add(ctrl.model);
    };
  });