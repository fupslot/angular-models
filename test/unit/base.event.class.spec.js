describe('BaseEventClass', function () {
  'use strict';

  var BaseEventClass;
  var BaseClass;
  var BaseModelClass;
  var Solder;
  var Base;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(inject(function (_BaseEventClass_, _BaseClass_, _BaseModelClass_) {
    BaseEventClass = _BaseEventClass_;
    BaseClass = _BaseClass_;
    BaseModelClass = _BaseModelClass_;
  }));

  beforeEach(function () {
    Base = BaseEventClass.extend({
      command: function(cmd) {
        this.trigger('cmd', this, cmd);
      }
    });

    Solder = BaseEventClass.extend({
      walk: function walk() {
        this.trigger('walk', this);
      },
      fire: function fire() {
        this.trigger('fire', this);
      },
      order: function(base, command) {
        this[command]();
      }
    });
  });

  it('should be inherited from a BaseClass', function(){
    var Eventable = BaseEventClass.extend({});
    var eventable = new Eventable();
    expect(eventable.typeOf).toBeDefined();
    expect(eventable.typeOf(BaseEventClass)).toBeTruthy();
    expect(eventable.typeOf(BaseClass)).toBeTruthy();
    expect(eventable.typeOf(BaseModelClass)).toBeFalsy();
  });

  it('should be able to extend an object', function () {
    var solder = new Solder();
    expect(solder.on).toBeDefined();
    expect(solder.off).toBeDefined();
    expect(solder.listenTo).toBeDefined();
    expect(solder.stopListening).toBeDefined();
    expect(solder.once).toBeDefined();
    expect(solder.listenToOnce).toBeDefined();
    expect(solder.trigger).toBeDefined();
  });

  it('should be able to define a custom event', function () {
    var walkEventSpy = jasmine.createSpy('walkEventSpy');
    var solder = new Solder();

    solder.on('walk', walkEventSpy);
    solder.walk(); // triggers a custom event
    expect(walkEventSpy).toHaveBeenCalledWith(solder);
  });

  it('should be able to listen special \'all\' event', function(){
    var eventSpy = jasmine.createSpy('eventSpy');
    var solder = new Solder();

    solder.on('all', eventSpy);
    solder.walk();
    solder.fire();
    expect(eventSpy).toHaveBeenCalled();
    expect(eventSpy.calls.count()).toEqual(2);
  });

  it('object should be able to listen other object\'s events', function(){
    var base = new Base();
    var solder = new Solder();
    var fireSpy = jasmine.createSpy('firespy');
    var walkSpy = jasmine.createSpy('walkspy');

    solder.on('fire', fireSpy);
    solder.on('walk', walkSpy);

    solder.listenTo(base, 'cmd', solder.order);

    base.command('walk');
    base.command('fire');

    expect(fireSpy).toHaveBeenCalledWith(solder);
    expect(walkSpy).toHaveBeenCalledWith(solder);
  });

});
