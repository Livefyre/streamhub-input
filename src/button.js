//var $ = require('streamhub-sdk/jquery');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Duplex = require('stream/duplex');
var inherits = require('inherits');
var Input = require('input');
var ModalInputCommand = require('modal/modal-input-command');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Transform = require('stream/transform');
var Upload = require('upload');

'use strict';

/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} A collection or other Writable to auto-pipe to.
 * @param [opts.input] {Input} Pipes the input to itself.
 * @constructor
 * @extends {Button}
 */
var InputButton = function(command, opts) {
    opts = opts || {};

    if (!command) {
        throw 'Can\'t create an InputButton without a command.';
    }

    /**
     * A collection or other Writable to pipe to.
     * @type {Writable}
     * @protected
     */
    this._destination = opts.destination;

    /**
     * The input to read from.
     * @type {Input}
     * @protected
     */
    this._input = opts.input;

    // var self = this;
    // command.callback = function (err, data) {
    //     data && data.forEach(function (content) {
    //         self._destination && self._destination.write(content);
    //     });
    // }
    
    Button.call(this, command, opts);
    Passthrough.call(this, opts);

    this._destination && this.pipe(this._destination);
    this._input && this._input.pipe(this);
};
inherits(InputButton, Button);
inherits.parasitically(InputButton, Passthrough);
//HACK (joao) Need to upgrade inherits.parasitically
inherits.parasitically(InputButton, Transform);
inherits.parasitically(InputButton, Duplex);
inherits.parasitically(InputButton, Readable);

/**
 * @override
 * @type {string}
 */
InputButton.prototype.elClass += ' lf-input-btn';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
InputButton.prototype.elTag = 'button';

module.exports = InputButton;
