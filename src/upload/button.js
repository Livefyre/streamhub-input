var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var Duplex = require('stream/duplex');
var inherits = require('inherits');
var InputButton = require('streamhub-input/button');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');
var Upload = require('streamhub-input/upload');

'use strict';

/**
 * @param [opts] {Object}
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @constructor
 * @extends {InputButton}
 */
function UploadButton(opts) {
    opts = opts || {};
    var input = new Upload();
    var command = new ModalInputCommand(input);

    if (opts.authRequired !== false) {
        command = new AuthRequiredCommand(command);
    }

    opts.input = opts.input || input;
    InputButton.call(this, command, opts);
}
inherits(UploadButton, InputButton);

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' hub-upload-btn';

module.exports = UploadButton;
