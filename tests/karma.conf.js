module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['jasmine', 'cajon'],
    files: [
      'requirejs.conf.js',
      'lib/streamhub-sdk/tests/lib/function.bind.js', // Polyfill for Phantom that must be loaded
      {pattern: 'package.json', included: false},
      {pattern: 'lib/**/*.js', included: false},
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'lib/**/*.mustache', included: false},
      {pattern: 'src/**/*.mustache', included: false},
      {pattern: 'tests/spec/**/*.js', included: false},
      'tests/tests-main.js'
    ],
    browsers: ['PhantomJS'],
    colors: true,
    singleRun: true,
    reporters: ['dots', 'progress'],
  });
};
