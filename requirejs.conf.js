require.config({
  baseUrl: '/',
  paths: {
    jquery: 'lib/jquery/jquery',
    text: 'lib/requirejs-text/text',
    base64: 'lib/base64/base64',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    json: 'lib/requirejs-plugins/src/json',
    jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    rework: 'lib/rework/rework',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    'observer': 'lib/observer/src/observer',
    inherits: 'lib/inherits/inherits',
    blanket: 'lib/blanket/dist/qunit/blanket',
    'blanket-jasmine': 'lib/blanket/dist/jasmine/blanket_jasmine',
    'mout': 'lib/mout/src'
  },
  packages: [{
    name: 'stream',
    location: 'lib/stream/src'
  },{
    name: 'auth',
    location: 'lib/auth/src'
  },{
    name: 'auth-delegates',
    location: 'lib/auth-delegates/src'
  },{
    name: 'debug',
    location: 'lib/debug',
    main: 'debug'
  },{
    name: 'livefyre-auth',
    location: 'lib/livefyre-auth/src'
  },{
    name: 'streamhub-editor',
    location: 'lib/streamhub-editor/src/javascript'
  },{
    name: 'streamhub-editor/templates',
    location: 'lib/streamhub-editor/src/templates'
  },{
    name: 'streamhub-sdk',
    location: 'lib/streamhub-sdk/src'
  },{
    name: 'streamhub-sdk/auth',
    location: 'lib/streamhub-sdk/src/auth'
  },{
    name: 'streamhub-sdk/ui/',
    location: 'lib/streamhub-sdk/src/ui'
  },{
    name: 'streamhub-sdk/collection',
    location: 'lib/streamhub-sdk/src/collection'
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
    name: 'streamhub-input',
    location: 'src',
    main: 'javascript/main'
  },{
    name: 'streamhub-wall',
    location: 'lib/streamhub-wall/src'
  },{
    name: 'streamhub-ui',
    location: 'lib/streamhub-ui/src'
  },{
    name: 'streamhub-share',
    location: 'lib/streamhub-share/src',
    main: 'share-button'
  },{
    name: 'tests',
    location: 'tests'
  },{
    name: 'view',
    location: 'lib/view/src',
    main: 'view'
  },{
    name: 'auth-delegates',
    location: 'lib/auth-delegates/src'
  },{
    name: 'css',
    location: 'lib/require-css',
    main: 'css'
  },{
    name: 'less',
    location: 'lib/require-less',
    main: 'less'
  },{
    name: "livefyre-bootstrap",
    location: "lib/livefyre-bootstrap/src"
  }],
  shim: {
    rework: {
          exports: 'rework'
    },
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
  },
  css: {
    clearFileEachBuild: 'dist/streamhub-input.min.css',
    transformEach: {
      requirejs: 'tools/prefix-css-requirejs',
      node: 'tools/prefix-css-node'
    }
  },
  less: {
    browserLoad: 'dist/streamhub-input.min',
    paths: ['lib'],
    relativeUrls: true,
    modifyVars: {
      "@icon-font-path": "\"http://cdn.livefyre.com/libs/livefyre-bootstrap/v1.1.0/fonts/\""
    }
  }
});
