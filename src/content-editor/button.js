var ContentEditor = require('streamhub-input/content-editor');
var inherits = require('inherits');
var InputButton = require('streamhub-input/button');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');

'use strict';

/**
 *
 * @param [opts] {Object}
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @constructor
 * @extends {InputButton}
 */
function ContentEditorButton(opts) {
    opts = opts || {};
    var input = new ContentEditor({
        mediaEnabled: opts.mediaEnabled
    });
    var command = new ModalInputCommand(input);

    opts.input = opts.input || input;
    InputButton.call(this, command, opts);
}
inherits(ContentEditorButton, InputButton);

/**
 * @override
 * @type {string}
 */
ContentEditorButton.prototype.elClass += ' comment-btn';

module.exports = ContentEditorButton;
