var authOptional = require('streamhub-sdk/auth/auth-optional');
var auth;

auth = authOptional;

if (typeof Livefyre !== 'undefined' &&
    typeof Livefyre['auth'] === 'object') {
    auth = Livefyre['auth'];
}

module.exports = auth;
