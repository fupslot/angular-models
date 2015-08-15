// var _ = require('lodash');

var extend = function(proto) {
  var parent = this;
  var child;

  if (proto && proto.hasOwnProperty('constructor')) {
    child = proto.constructor.value;
  } else {
    child = function() { return parent.apply(this, arguments); };
  }

  child.prototype = Object.create(parent.prototype, proto);

  child.__super__ = parent.prototype;

  return child;
};

function Base () {
  console.log('Base constructor');
}
Base.prototype = Object.create({}, {
  constructor: {
    value: Base,
    configurable: true,
    writable: true
  },
  print: {
    value: function print () {
      console.log('Base print');
    }
  }
});

Base.extend = extend;

var Person = Base.extend({
  constructor: {
    value: function constructor () {
      Base.apply(this, arguments);
      console.log('Person constructor');
    }
  },
  print: {
    value: function print () {
      // Call a super class
      // Base.prototype.print.apply(this, arguments);
      console.log('Person Print');
    }
  }
});

Person.extend = extend;

var Me = Person.extend({
  constructor: {
    value: function () {
      Person.apply(this, arguments);
      console.log('Me constructor');
    }
  }
});

console.log('---------Base--------');
var base = new Base();
base.print();

console.log('---------Person--------');
var person = new Person();
person.print();

console.log('---------Me--------');
var me = new Me();
me.print();

console.log('---------Types--------');
console.log('base instanceof Object : %s', person instanceof Object);
console.log('base instanceof Base : %s', base instanceof Base);
console.log('person instanceof Base : %s', person instanceof Base);
console.log('me instanceof Person : %s', me instanceof Person);
console.log('me instanceof Me : %s', person instanceof Me);

