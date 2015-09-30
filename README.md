#Angular models
![Latest build](https://img.shields.io/badge/latest-v0.0.5-brightgreen.svg)
![Latest build](https://travis-ci.org/fupslot/angular-models.svg?branch=master)

Please file issues against that repo.

##Getting started

You can install this package with `bower`.

```shell
bower install angular.models --save
```

You must `require` **angular.models** module in your project:


```js
angular.module('MyProject', ['angular.models']);
```

##Documentation

### BaseModelClass

Use BaseModelClass as a base class to define your own models.

#### Create a basic custom model

Note: The best practice is to define your models within factories, then reference them within services to create instances.


```js
angular.module('myApp', ['angular.models'])
  .factory('CustomModelClass', function (BaseModelClass) {
    'use strict';

    return BaseModelClass.extend({
      urlRoot: {
      	value: '/persons'
      }
    });
  })
  .controller('mainCtrl', function(CustomModelClass){
  	this.model = new CustomModelClass({id: 1});
  	this.model.fetch(); //-> Promise
  });
```

#### Create a custom model with default parameters

```js
angular.module('myApp', ['angular.models'])
  .factory('CustomModelClass', function (BaseModelClass) {
    'use strict';
    return BaseModelClass.extend({
	    defaults: {
		  value: {
			name: 'Untitled book',
			price: 0.0
		  }
	    },

        urlRoot: {
      	    value: '/persons'
        }

	    name: {
		    get: function() {
			    return this.get('name');
		    },
		    set: function(value) {
			    this.set('name',  value);
		    }
	    },

	    price: {
		    get: function() {
			    return this.get('price');
		    },
		    set: function(value) {
			    if (_.isNumber(value)) {
			        this.set('name',  value);
			    }
		    }
	    },
    });
  })
  .controller('mainCtrl', function(CustomModelClass){
  	this.model = new CustomModelClass();
  	this.model.name //-> 'Untitled book'
  	this.model.price //-> 0.0
  });
```

more comming....


## License

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
