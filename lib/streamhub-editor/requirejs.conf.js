require.config({
  baseUrl: '/',
  paths: {
    chai: 'lib/chai/chai',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    hogan: 'lib/requirejs-hogan-plugin/hogan',
    inherits: 'lib/inherits/inherits',
    jquery: 'lib/jquery/jquery',
    mocha: 'lib/mocha/mocha',
    mustache: 'lib/mustache/mustache',
    text: 'lib/requirejs-hogan-plugin/text',
    sinon: 'lib/sinonjs/sinon',
    'sinon-chai': 'lib/sinon-chai/lib/sinon-chai'
  },
  packages: [
    {
      name: 'streamhub-editor',
      location: 'src/javascript',
      main: 'editor'
    },{
      name: 'templates',
      location: 'src/templates'
    },{
      name: 'view',
      location: 'lib/view/src',
      main: 'view'
    }
  ],
  shim: {
    jquery: {
      exports: '$'
    },
    'sinon': {
      exports: 'sinon'
    }
  }
});
