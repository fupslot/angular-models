describe('BaseSyncClass', function () {
  var MyClass;
  var BaseModelClass;
  var BaseSyncClass;
  var $httpBackend;

  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseSyncClass_, _BaseModelClass_, _$httpBackend_){
    BaseModelClass = _BaseModelClass_;
    BaseSyncClass = _BaseSyncClass_;
    $httpBackend = _$httpBackend_;

    MyClass = _BaseSyncClass_.extend({
      fetch: function(){
        var self = this;
        var options = {};

        options.url = '/api/models';
        options.success = function(response){
          self.id = response.id;
        };

        this.sync('read', null, options);
      }
    });
  }));

  it('be able to extend from BaseSyncClass', function(){
    var myClass = new MyClass();
    $httpBackend.expectGET('/api/models')
      .respond(200, {id: 1});

    myClass.fetch();
    $httpBackend.flush();
    expect(myClass instanceof BaseSyncClass).toBeTruthy();
    expect(myClass.id).toEqual(1);
  });

  it('can define headers', function(){
    var Model = BaseModelClass.extend({});
    var model = new Model({id: 1});
    var headers;

    function successFn(d, s, h, config) { headers = config.headers; }
    $httpBackend.expectGET('/models').respond(200, {id: 1, name: 'iPhone'});
    model.sync('read', model, {url: '/models', headers: {'accept': 'application/json'}}).success(successFn);
    $httpBackend.flush();
    expect(headers).toBeDefined();
    expect(headers['accept']).toEqual('application/json');
  });

  it('transform response and response', function () {
    function transformRequest(data) {
      return {data: data};
    }
    function transformResponse(data) {
      return data.data;
    }
    var Model = BaseModelClass.extend({url: '/models/1', $transformResponse: transformResponse, $transformRequest: transformRequest});
    var model = new Model({id: 1});

    $httpBackend.expectGET('/models/1').respond(200, {data: {id: 1, name: 'iPhone'}});
    model.fetch();
    $httpBackend.flush();

    expect(model.$get('name')).toEqual('iPhone');
  });
});
