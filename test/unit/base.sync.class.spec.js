describe('BaseSyncClass', function () {
  var MyClass;
  var BaseSyncClass;
  var $httpBackend;

  beforeEach(module('angular.models'));

  beforeEach(inject(function(_BaseSyncClass_, _$httpBackend_){
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
});