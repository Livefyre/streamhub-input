//var $ = require('streamhub-sdk/jquery');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Duplex = require('stream/duplex');
var inherits = require('inherits');
var Input = require('streamhub-input');
var ModalInputCommand = require('streamhub-input/modal/modal-input-command');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Transform = require('stream/transform');
var Upload = require('streamhub-input/upload');

'use strict';

/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} A collection or other Writable to auto-pipe to.
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
    
    Button.call(this, command, opts);
    Passthrough.call(this, opts);

    this._destination && this.pipe(this._destination);
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
InputButton.prototype.elClass += ' hub-input-btn';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
InputButton.prototype.elTag = 'button';

module.exports = InputButton;
