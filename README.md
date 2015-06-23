#Angular models

###How to use a BaseModel


```js

angular.module('myApp', ['angular.models'])
  .controller('appCtrl', function (BaseModel) {
    'use strict';

    this.person = BaseModel.extend({
      urlRoot: '/persons'
    });
  });

```