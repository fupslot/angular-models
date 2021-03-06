describe('Extend ', function () {
  'use strict';
  var Extend, BaseClass;
  var BaseCls, PersonCls, MeCls;
  var BaseConstructorSpy;
  var PersonConstructorSpy;
  var MeConstructorSpy;

  // load the directive's module and view
  beforeEach(module('angular.models'));

  beforeEach(function () {
    BaseConstructorSpy = jasmine.createSpy('BaseConstructorSpy');
    PersonConstructorSpy = jasmine.createSpy('PersonConstructorSpy');
    MeConstructorSpy = jasmine.createSpy('MeConstructorSpy');
  });

  // Defining classes
  beforeEach(inject(function (_Extend_, _BaseClass_) {
    Extend = _Extend_;
    BaseClass = _BaseClass_;

    // Base class
    function Base () {
      BaseConstructorSpy();
    }

    Base.prototype = Object.create({}, {
      constructor: {
        value: Base,
        configurable: true,
        writable: true
      },
      print: {
        value: function print () {
          return 'Base';
        }
      }
    });

    Base.extend = Extend;
    BaseCls = Base;

    // Person class
    var Person = Base.extend({
      constructor: {
        value: function constructor () {
          Base.apply(this, arguments);
          PersonConstructorSpy();
        }
      },
      print: {
        value: function print () {
          return 'Person';
        }
      }
    });

    Person.extend = Extend;
    PersonCls = Person;

    // Me class
    var Me = Person.extend({
      constructor: {
        value: function () {
          Person.apply(this, arguments);
          MeConstructorSpy();
        }
      }
    });

    MeCls = Me;
  }));

  describe('\'typeOf\'', function(){
    var CustomClass;

    beforeEach(function(){
      CustomClass = BaseClass.extend({
        print: function print() {}
      });
    });

    it('Class that inherited from a BaseClass should have \'typeOf\' method', function(){
      var customClass = new CustomClass();
      expect(CustomClass.typeOf(customClass)).toBeTruthy();
    });
  });

  describe('\'__super__\'', function() {
    var CustomClass;
    beforeEach(function () {
      CustomClass = BaseClass.extend({});
    });

    it('reference to a super class should be accessable over a __super__ property', function () {
      expect(CustomClass.__super__).toBeDefined();
      expect(CustomClass.__super__).toEqual(BaseClass.prototype);
    });
  });

  describe('Extend', function() {

    describe('Base class', function () {
      it('should inherit an Object class', function () {
        var base = new BaseCls();
        expect(base.print()).toEqual('Base');
        expect(base instanceof BaseCls).toBeTruthy();
        expect(base instanceof Object).toBeTruthy();
      });
    });

    describe('Person class', function () {
      var person;

      beforeEach(function () {
        person = new PersonCls();
      });

      it('Constructors should run', function () {
        expect(BaseConstructorSpy).toHaveBeenCalled();
        expect(PersonConstructorSpy).toHaveBeenCalled();
      });

      it('should be inherited from a Base class', function () {
        expect(person instanceof Object).toBeTruthy();
        expect(person instanceof BaseCls).toBeTruthy();
        expect(person instanceof PersonCls).toBeTruthy();
        expect(person.print()).toEqual('Person');
      });
    });

    describe('Me class', function  () {
      var me;

      beforeEach(function () {
        me = new MeCls();
      });

      it('should be inherited from a Person class', function () {
        expect(me instanceof Object).toBeTruthy();
        expect(me instanceof BaseCls).toBeTruthy();
        expect(me instanceof PersonCls).toBeTruthy();
        expect(me instanceof MeCls).toBeTruthy();
      });

      it('should call Person#print method', function () {
        expect(me.print()).toEqual('Person');
      });
    });
  });
});
