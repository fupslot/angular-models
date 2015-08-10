angular.module('angular.models.core.sync', ['angular.models.helper', 'angular.models.core.events'])
  .factory('Sync', function ($http, _, Events) {
    'use strict';
    var proto;

    /**
     * @class Sync
     * @description Override this function to change the manner in which Backbone persists
     *              models to the server. You will be passed the type of request, and the
     *              model in question. By default, makes a RESTful Ajax request
     *              to the model's `url()`. Some possible customizations could be:
     *
     *              * Use `setTimeout` to batch rapid-fire updates into a single request.
     *              * Send up the models as XML instead of JSON.
     *              * Persist models via WebSockets instead of Ajax.
     *
     *              Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
     *              as `POST`, with a `_method` parameter containing the true HTTP method,
     *              as well as all requests with the body as `application/x-www-form-urlencoded`
     *              instead of `application/json` with the model in a param named `model`.
     *              Useful when interfacing with server-side languages like **PHP** that make
     *              it difficult to read the body of `PUT` requests.
     */
    function Sync () {}

    proto = Sync.prototype = Object.create(Events.prototype);

    /**
     * @function Sync#sync
     * @description Proxy `Sync` by default -- but override this if you need
     *              custom syncing semantics for *this* particular model.
     * @param  {string} method   GET, POST, PUT, DELETE methods
     * @param  {BaseModelClass} model An instance of a BaseModelClass
     * @param  {Object} options An options
     * @return {Promise}
     */
    Object.defineProperty(proto, 'sync', {
      value: function (method, model, options) {
        // Default options, unless specified.
        _.defaults(options || (options = {}));

        // Default JSON-request options.
        var params = _.extend({method: method, dataType: 'json', cache: false}, _.pick(options, 'params'));

        params.headers = {};
        params.headers['accept'] = 'application/json, text/plain, */*';

        params.url = options.url || _.result(model, 'url');
        // Ensure that we have a URL.
        if (!params.url) {
          throw new Error('A "url" property or function must be specified');
        }

        // if (options.params)

        // Ensure that we have the appropriate request data.
        if (options.data == null && model && _.include(['POST', 'PUT', 'PATCH'], method)) {
          params.headers['content-type'] = 'application/json';
          params.data = JSON.stringify(options.attrs || model.toJSON(options));
        }

        options.success = options.success || angular.noop;
        options.error = options.error || angular.noop;

        return $http(params)
          .success(options.success)
          .error(options.error);
      }
    });

    return Sync;
  });
