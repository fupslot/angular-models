'use strict';

angular.module('angular.models.config', [])
.constant('MODELS_CONFIG',(function modelsConfigBuilder(){
  var factory = {

  };

  factory.getUrl = function(key) {
    return this.ENDPOINT_PREFIX + this[key];
  };
  return factory;
})());
