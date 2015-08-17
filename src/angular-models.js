'use strict';
/**
 * @namespace Core
 * @description Namespace Core.
 */
angular.module('angular.models', [
  'angular.models.core.extend',
  'angular.models.core.sync',
  'angular.models.core.model',
  'angular.models.core.collection',
  'angular.models.helper',
  'angular.models.exception.validation'
]);
