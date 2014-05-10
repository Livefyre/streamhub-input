//var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var InputButton = require('streamhub-input/button');
var ContentEditor = require('streamhub-input/content-editor');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');

'use strict';

/**
 *
 * @param [opts] {Object}
 * @param [opts.command] {Command} A Command to replace the default,
 *          incase it isn't good enough for you.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @constructor
 * @extends {InputButton}
 */
function EditorLaunchButton(opts) {
    opts = opts || {};
    this._editor = new ContentEditor(opts);
    var command = new ModalInputCommand(this._editor, opts);
    if (opts.authRequired !== false) {
        command = new AuthRequiredCommand(command);
    }

    InputButton.call(this, command, opts);
    this._editor.pipe(this);
    opts.destination && this.pipe(opts.destination);
};
inherits(EditorLaunchButton, InputButton);

/**
 * @override
 * @type {string}
 */
EditorLaunchButton.prototype.elClass += ' comment-btn';

module.exports = EditorLaunchButton;
