({
  mainConfigFile: '../requirejs.conf.js',
  paths: {
    almond: 'lib/almond/almond',
    auth: 'tools/auth-stub',
    jquery: 'lib/jquery/jquery.min'
  },
  baseUrl: '..',
  buildCSS: true,
  separateCSS: true,
  name: "streamhub-input",
  include: [
    'almond'
  ],
  stubModules: ['text', 'hgn', 'json', 'less/less'],
  exclude: ['css/normalize', 'less/normalize'],
  out: "../dist/streamhub-input.min.js",
  pragmasOnSave: {
    excludeHogan: true,
    excludeRequireCss: true
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
  wrap: {
    startFile: 'wrap-start.frag',
    endFile: 'wrap-end.frag'
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
