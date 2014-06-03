var rework = require('rework');
var packageJson = require('json!package.json');
var prefix = require('./prefix-css');

module.exports = prefix.bind({}, packageJson, rework);
