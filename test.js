var _ = require('lodash');

function BaseClass(){}

function hasProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isDescriptor(obj) {
  return _.isObject(obj) && (hasProperty(obj, 'value') || hasProperty(obj, 'get') || hasProperty(obj, 'set'));
}


function Extend (proto, statics) {
  var parent = this;
  var child;

  if (proto && hasProperty(proto, 'constructor')) {
    child = isDescriptor(proto.constructor) ? proto.constructor.value : proto.constructor;
  } else {
    child = function() { return parent.apply(this, arguments); };
  }

  var properties = {};
  _.each(proto, function(value, key) {
    properties[key] = isDescriptor(value) ? value : {value: value};
  });

  child.prototype = Object.create(parent.prototype, properties);

  child.__super__ = parent.prototype;

  if (!_.isEmpty(statics)) {
    _.each(statics, function (value, key) {
      Object.defineProperty(child, key, {value:value});
    });
  }

  return child;
}

// BaseClass
// BaseEventClass
// BaseSyncClass -> BaseEventClass
BaseClass.extend = Extend;

var statics = {};

statics.getSomeValue = function getSomeValue() {
  return 'Some value';
};

var MyClass = BaseClass.extend({
  'constructor': {
    value: function(){
      console.log('constructor');
    }
  },
  'getName': function getName () {
    return 'Eugene';
  },
  name: {get: function(){ return 1; }}
}, statics);

var myClass = new MyClass();
console.log(myClass.getName());
console.log(myClass.name);
console.log(MyClass.getSomeValue());