angular.module('angular.models.core.sync', ['angular.models.helper'])
  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  .factory('Sync', function ($http, _) {
    'use strict';

    function Sync (method, model, options) {
      // Default options, unless specified.
      _.defaults(options || (options = {}));

      // Default JSON-request options.
      var params = {method: method, dataType: 'json', cache: false};

      params.headers = {};
      params.headers['accept'] = 'application/json, text/plain, */*';

      params.url = options.url || _.result(model, 'url');
      // Ensure that we have a URL.
      if (!params.url) {
        throw new Error('A "url" property or function must be specified');
      }

      // Ensure that we have the appropriate request data.
      if (options.data == null && model && _.include(['POST', 'PUT', 'PATCH'], method)) {
        params.headers['content-type'] = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
      }

      // Pass along `textStatus` and `errorThrown` from jQuery.
      // var success = options.success || angular.noop;
      // var error = options.error || angular.noop;
      // options.error = function(response) {
      //   // options.textStatus = textStatus;
      //   // options.errorThrown = errorThrown;
      //   if (error) {
      //     error.call(options.context, response);
      //   }
      // };
      return $http(params);
    }

    return Sync;
  });
