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
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @constructor
 * @extends {Button}
 */
function UploadButton(opts) {
    opts = opts || {};
    this._upload = new Upload(opts);
    var command = new ModalInputCommand(this._upload, opts);

    if (opts.authRequired !== false) {
        command = new AuthRequiredCommand(command);
    }

    InputButton.call(this, command, opts);
    this._upload.pipe(this);
};
inherits(UploadButton, InputButton);

/**
 * @override
 * @type {string}
 */
UploadButton.prototype.elClass += ' hub-upload-btn';

module.exports = UploadButton;
