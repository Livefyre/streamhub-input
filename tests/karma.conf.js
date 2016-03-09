module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['jasmine', 'cajon'],
    files: [
      'requirejs.conf.js',
      'lib/streamhub-sdk/tests/lib/function.bind.js', // Polyfill for Phantom that must be loaded
      {pattern: 'package.json', included: false},
      {pattern: 'lib/**/*.js', included: false},
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'src/styles/*', included: false},
      {pattern: 'lib/**/*.mustache', included: false},
      {pattern: 'src/**/*.mustache', included: false},
      {pattern: 'tests/spec/**/*.js', included: false},
      'tests/tests-main.js',
      {pattern: 'dist/streamhub-input.min.css', included: false},
      {pattern: 'https://api.filepicker.io/v2/filepicker.js', included: false}
    ],
    proxies: {
      '/https://api.filepicker.io/v2/filepicker.js': 'https://api.filepicker.io/v2/filepicker.js'
    },
    browsers: ['PhantomJS'],
    colors: true,
    singleRun: true,
    reporters: ['dots', 'progress']
  });
};
