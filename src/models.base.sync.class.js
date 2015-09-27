'use strict';

angular.module('angular.models')

.provider('BaseSyncClass', function () {

  // The HTTP method map.
  var CRUD_MAP = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  this.setOperation = function setOperation(operation, method) {
    if (CRUD_MAP.hasOwnProperty(operation)) {
      CRUD_MAP[operation] = method;
    }
  };

  this.$get = /*@ngInject*/ function($http, _, Extend, BaseEventClass) {
    /**
     * @class BaseSyncClass
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
    // function BaseSyncClass () {}

    // proto = BaseSyncClass.prototype = Object.create(BaseEventClass.prototype);

    return BaseEventClass.extend({

      /**
       * @function BaseSyncClass#sync
       * @description Proxy `BaseSyncClass` by default.
       *              Override this if you need custom syncing semantics for a particular model.
       * @param  {string} method  One of a CRUD operations. Ex: read, create, update or delete.
       * @param  {BaseModelClass} model An instance of a model class where the sync method have been called
       * @param  {Object} options An options
       * @return {Promise}
       *
       * @example <caption>How to re-map CRUD operations</caption>
       * angular.module('myProject', ['angular.models'])
       *   // Default map:
       *   //  'create' -> 'POST'
       *   //  'read' -> 'GET'
       *   //  'update' -> 'PUT'
       *   //  'delete' -> 'DELETE'
       *   //  'patch' -> 'PATCH'
       *   .config(function (SyncProvider) {
       *     // It will force BaseModelClass and BaseCollectionClass
       *     // invoke a 'POST' method instead of 'GET'.
       *     // NOTE: All you models and collection will inherit that behaviour
       *     // as long as you won't override it for a particular class.
       *     SyncProvider.setOperation('read', 'POST');
       *   })
       *   .factory('MyModelClass', function (BaseModelClass) {
       *     return BaseModelClass.extend({
       *       urlRoot: { value: '/api/models'}
       *     });
       *   })
       *   .controller(function(MyModelClass){
       *     var myModel = new MyModelClass();
       *     myModel.fetch(); //-> Will reserve a POST request
       *   });
       */
      sync: function (method, model, options) {
        var dynamicQueryParams = {};

        method = CRUD_MAP[method];

        // Default options, unless specified.
        _.defaults(options || (options = {}));

        // Request method, unless specified
        options.method = options.method || method;

        // Default JSON-request options.
        var params = _.pick(options, ['method', 'cache', 'timeout', 'params', 'withCredentials', 'xsrfHeaderName', 'xsrfCookieName']);

        params.headers = options.headers || {};

        // Set 'Accept' header by default
        if (!params.headers['accept']) {
          params.headers['accept'] = 'application/json, text/plain, */*';
        }

        params.url = options.url || _.result(model, 'url');
        // Ensure that we have a URL.
        if (!params.url) {
          throw new Error('A "url" property or function must be specified');
        }

        // Obtains a dynamic query params,
        // NOTE: must solve angular circular dependency issue
        // if (isModel(model)) {
        if (model && model.getQueryParams) {
          dynamicQueryParams = model.getQueryParams();
        }
        // Query params
        params.params = _.extend({}, dynamicQueryParams, params.params);

        // Ensure that we have the appropriate request data.
        if (options.data == null && model && _.include(['POST', 'PUT', 'PATCH'], method)) {
          params.headers['content-type'] = 'application/json';
          params.data = JSON.stringify(options.attrs || model.toJSON(options));
        }

        // If no cache specified we going to use a default value
        if (!params.hasOwnProperty('cache')) {
          params.cache = this.change;
        }

        params.transformResponse = this.$transformResponse;
        params.transformRequest = this.$transformRequest;

        options.success = options.success || angular.noop;
        options.error = options.error || angular.noop;

        return $http(params)
          .success(options.success)
          .error(options.error);
      },

      /**
       * @var BaseSyncClass#cache
       * @description If true, a default $http cache will be used to cache the GET request
       * @type {Boolean}
       */
      cache: {value: false, writable: true},

      /**
       * @function BaseSyncClass#transformResponse
       * @description A transform function or an array of such functions.
       *              The transform function takes the http response body,
       *              headers and status and returns its transformed (typically deserialized)
       *              version.
       * @param  {Object|Array} data  A response object or an array
       * @param  {Object} headers Headers getter
       * @param  {Object} status  A status that server respond with
       * @return {Object} A transformed response
       */
      $transformResponse: function $transformResponse(data) {
        return data;
      },

      /**
       * @function BaseSyncClass#$transformResponse
       * @description Transform response function
       * @param  {Object} data A request data
       * @return {Object}  A transformed request
       */
      $transformRequest: function $transformRequest(data){
        return data;
      }
    }, {extend: Extend});
  };
});
