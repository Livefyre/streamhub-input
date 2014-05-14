var inherits = require('inherits');
var InputButton = require('streamhub-input/button');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');
var Upload = require('streamhub-input/upload/view');

'use strict';

/**
 * @param [opts] {Object}
 * @constructor
 * @extends {InputButton}
 */
function UploadButton(opts) {
    opts = opts || {};
    var input = new Upload();
    var command = new ModalInputCommand(input);

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
