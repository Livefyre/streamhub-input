require.config({
  paths: {
    jquery: 'lib/jquery/jquery',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    mocha: 'lib/mocha/mocha',
    chai: 'lib/chai/chai'
  },
  packages: [{
    name: 'view',
    location: 'src',
    main: 'view'
  }],
  shim: {
    jquery: {
        exports: '$'
    }
  }
});
