require.config({
  paths: {
    jquery: 'lib/jquery/jquery',
    text: 'lib/requirejs-text/text',
    base64: 'lib/base64/base64.min',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    json: 'lib/requirejs-plugins/src/json',
    jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    blanket: 'lib/blanket/dist/qunit/blanket',
    'blanket-jasmine': 'lib/blanket/dist/jasmine/blanket_jasmine'
  },
  packages: [{
    name: 'streamhub-editor',
    location: 'lib/streamhub-editor/src/javascript'
  },{
    name: 'streamhub-sdk',
    location: 'lib/streamhub-sdk/src'
  },{
    name: 'streamhub-sdk/auth',
    location: 'lib/streamhub-sdk/src/auth'
  },{
    name: 'streamhub-sdk/ui/button',
    location: 'lib/streamhub-sdk/src/ui',
    main: 'button'
  },{
    name: 'streamhub-sdk/collection',
    location: 'lib/streamhub-sdk/src/collection'
  },{
    name: 'streamhub-sdk/ui/command',
    location: 'lib/streamhub-sdk/src/ui',
    main: 'command'
  },{
    name: 'streamhub-sdk/content',
    location: 'lib/streamhub-sdk/src/content'
  },{
    name: 'streamhub-sdk/modal',
    location: 'lib/streamhub-sdk/src/modal'
  },{
    name: 'streamhub-sdk/jquery',
    location: 'lib/streamhub-sdk/src',
    main: 'jquery'
  },{
    name: 'streamhub-wall',
    location: 'lib/streamhub-wall/src'
  },{
    name: 'comment',
    location: 'src/comment'
  },{
    name: 'input',
    location: 'src'
  },{
    name: 'modal',
    location: 'src/modal'
  },{
    name: 'stream',
    location: 'lib/stream/src'
  },{
    name: 'tests',
    location: 'tests'
  },{
    name: 'upload',
    location: 'src/upload'
  },{
    name: 'view',
    location: 'lib/view/src',
    main: 'view'
  }],
  shim: {
    jquery: {
        exports: '$'
    },
    jasmine: {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine'],
        exports: 'jasmine'
    },
    'blanket-jasmine': {
        exports: 'blanket',
        deps: ['jasmine']
    },
    'jasmine-jquery': {
        deps: ['jquery']
    }
  }
});
