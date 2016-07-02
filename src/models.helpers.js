'use strict';

angular.module('angular.models')

.factory('isModel', function (BaseModelClass){
  'use strict';
  return function isModel(obj) {
    return obj instanceof BaseModelClass;
  };
})

.factory('WrapError', function (lodash) {
  'use strict';
  // Wrap an optional error callback with a fallback error event.
  function WrapError (model, reject, options) {
    // Arguments: xhr, textStatus, errorThrown
    options.error = function () {
      var args = [].concat([model], lodash.toArray(arguments));
      if (model) {
        model.trigger.apply(model, [].concat(['error'], args));
      }
      var argsObj = lodash.zipObject(['model', 'xhr', 'textStatus', 'error'], args);
      if (reject) {
        reject(argsObj);
      }
    };
  }

  return WrapError;
});
