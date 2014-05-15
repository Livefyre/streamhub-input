var authOptional = require('streamhub-sdk/auth/auth-optional');
var auth;

auth = authOptional;
console.log('stub');

if (typeof Livefyre !== 'undefined' &&
    typeof Livefyre['auth'] === 'object') {
    auth = Livefyre['auth'];
}

module.exports = auth;
