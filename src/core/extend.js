angular.module('angular.models.core.extend', [])
  .factory('Extend', function () {
    'use strict';

    function Extend (proto) {
      var parent = this;
      var child;

      if (proto && proto.hasOwnProperty('constructor')) {
        child = proto.constructor.value;
      } else {
        child = function() { return parent.apply(this, arguments); };
      }

      child.prototype = Object.create(parent.prototype, proto);

      child.__super__ = parent.prototype;

      return child;
    }

    return Extend;
  });
