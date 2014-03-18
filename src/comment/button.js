//var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var InputButton = require('streamhub-input/button');
var Command = require('streamhub-sdk/ui/command');
var Comment = require('streamhub-input/comment');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');

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
var CommentButton = function(opts) {
    opts = opts || {};
    this._input = new Comment(opts);
    command = opts.command || new ModalInputCommand(this._input, opts);

    InputButton.call(this, command, opts);
    this._input.pipe(this);
};
inherits(CommentButton, InputButton);

/**
 * @override
 * @type {string}
 */
CommentButton.prototype.elClass += ' hub-comment-btn';

module.exports = CommentButton;
