describe('Core: BaseCollection', function () {
  'use strict';
  beforeEach(module('angular.models'));

  describe('Initialization', function(){
    it('should be able to extend BaseCollection', inject(function(BaseModel, BaseCollection){
      var Persons = BaseCollection.extend({
        model: BaseModel.extend({rootUrl:'/persons'})
      });

      var person = new Persons();
    }));
  });
});