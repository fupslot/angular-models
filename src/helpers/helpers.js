angular.module('angular.models.helper', ['angular.models.core.model'])
  // Lodash reference
  .factory('_', ['$window',
    function ($window) {
      'use strict';
      return $window._;
    }
  ])

  .factory('isModel', function (BaseModelClass){
    'use strict';
    return function isModel(obj) {
      return obj instanceof BaseModelClass;
    };
  })

  .factory('WrapError', function (_) {
    'use strict';
    // Wrap an optional error callback with a fallback error event.
    function WrapError (model, reject, options) {
      // Arguments: xhr, textStatus, errorThrown
      options.error = function () {
        var args = [].concat([model], _.toArray(arguments));
        if (model) {
          model.trigger.apply(model, [].concat(['error'], args));
        }
        var argsObj = _.zipObject(['model', 'xhr', 'textStatus', 'error'], args);
        if (reject) {
          reject(argsObj);
        }
      };
    }

    return WrapError;
  });
