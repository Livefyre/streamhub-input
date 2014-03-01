# karma-requirejs  [![Build Status](https://travis-ci.org/xdamman/karma-cajon.png?branch=master)](https://travis-ci.org/xdamman/karma-cajon)

> Adapter for the [Cajon](https://github.com/requirejs/cajon/) framework.


## Installation

    npm install karma-cajon
    
Then add to you Karma configuration file `'cajon'` as a framework to use:

```coffee
module.exports = (karma) ->
  karma.configure

    # frameworks to use
    frameworks: ['mocha', 'cajon']

    # ...
```

----

For more information on Karma see the [homepage].


[homepage]: http://karma-runner.github.io/
