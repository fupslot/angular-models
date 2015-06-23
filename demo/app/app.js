angular.module('myApp', ['angular.models'])
  .controller('appCtrl', function ($parse, BaseModel) {
    'use strict';

    var Person = BaseModel.extend({
        urlRoot: '/persons'
    });
    var person = new Person({name:'Bon Jovi'});
    person.save()
      .then(function(){
        console.log('1');
      }, function(){
        console.log('2');
      })
      .catch(function(response) {
        console.log(response);
      });
    console.log(person);
});