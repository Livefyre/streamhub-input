//var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var InputButton = require('input/button');
var Command = require('streamhub-sdk/ui/command');
var Edit = require('comment');
var ModalInputCommand = require('modal/modal-input-command');

'use strict';

/**
 * 
 * @param [opts] {Object}
 * @param [opts.command] {Command} A Command to replace the default,
 *          incase it isn't good enough for you.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @constructor
 * @extends {InputButton}
 */
var EditButton = function(opts) {
    opts = opts || {};
    this._input = new Edit(opts);
    command = opts.command || new ModalInputCommand(this._input, opts);

    InputButton.call(this, command, opts);
    this._input.pipe(this);
};
inherits(EditButton, InputButton);

/**
 * @override
 * @type {string}
 */
EditButton.prototype.elClass += ' lf-edit-btn';

module.exports = EditButton;
