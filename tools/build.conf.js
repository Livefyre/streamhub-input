({
  mainConfigFile: '../requirejs.conf.js',
  paths: {
    jquery: 'lib/jquery/jquery.min',
    almond: 'lib/almond/almond'
  },
  baseUrl: '..',
  name: "streamhub-input",
  include: [
    'almond',
    'streamhub-input/comment/button',
    'streamhub-input/upload/button',
    'streamhub-sdk',
    'streamhub-sdk/jquery',
    'streamhub-sdk/collection',
    'streamhub-sdk/content',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/views/list-view',
    'streamhub-sdk/auth',
    'streamhub-sdk/modal',
    'streamhub-wall',
    'auth-delegates/delegates/livefyre'
  ],
  stubModules: ['text', 'hgn', 'json'],
  out: "../dist/streamhub-input.min.js",
  namespace: 'HubInput',
  pragmasOnSave: {
    excludeHogan: true
  },
  cjsTranslate: true,
  optimize: "uglify2",
  preserveLicenseComments: false,
  uglify2: {
    compress: {
      unsafe: true
    },
    mangle: true
  },
  generateSourceMaps: true,
  onBuildRead: function(moduleName, path, contents) {
    switch (moduleName) {
      case "jquery":
      // case "base64":
        contents = "define([], function(require, exports, module) {" + contents + "});";
    }
    return contents;
  }
})
