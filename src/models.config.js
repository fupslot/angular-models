'use strict';

angular.module('angular.models.config', [])
.constant('MODELS_CONFIG',(function configBuilder(){
  var factory = {

  };

  factory.getUrl = function(key) {
    return this.ENDPOINT_PREFIX + this[key];
  };
  return factory;
})());
