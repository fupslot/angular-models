'use strict';

angular.module('angular.models')

.factory('BaseClass', function (Extend) {
  function BaseClass(){}
  BaseClass.extend = Extend;
  return BaseClass;
});
