describe('Core: Events', function () {
  'use strict';

  var Events;

  // load the directive's module and view
  beforeEach(module('angular.models'));


  beforeEach(inject(function (_BaseEventClass_) {
    Events = _BaseEventClass_;
  }));

  describe('should be able', function () {
    var MyObject;

    beforeEach(function () {
      MyObject = Events.extend({
        'doSomething': {
          value: function () {
            this.trigger('custom', this);
          }
        }
      });
    });

    it('to extend an object', function () {
      var myObject = new MyObject();
      expect(myObject.on).toBeDefined();
      expect(myObject.off).toBeDefined();
      expect(myObject.listenTo).toBeDefined();
      expect(myObject.stopListening).toBeDefined();
      expect(myObject.once).toBeDefined();
      expect(myObject.listenToOnce).toBeDefined();
      expect(myObject.trigger).toBeDefined();
    });

    it('to define a custom event', function () {
      var customEventSpy = jasmine.createSpy('customEventSpy');
      var myObject = new MyObject();

      myObject.on('custom', customEventSpy);
      myObject.doSomething(); // triggers a custom event
      expect(customEventSpy).toHaveBeenCalledWith(myObject);
    });
  });

});
