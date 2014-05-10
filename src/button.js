var Button = require('streamhub-sdk/ui/button');
var inherits = require('inherits');
var Readable = require('stream/readable');

'use strict';

/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} A collection or other Writable to auto-pipe to.
 * @constructor
 * @extends {Button}
 */
 function InputButton(command, opts) {
    Button.apply(this, arguments);
    Readable.call(this);

    opts.destination && this.pipe(opts.destination);
};
inherits(InputButton, Button);
inherits.parasitically(InputButton, Readable);

/** @override */
InputButton.prototype._read = function () {
    return null;
};

/**
 * @override
 * @type {string}
 */
InputButton.prototype.elClass += ' input-btn';

/**
 * The default element tag.
 * @override
 * @type {!string}
 */
InputButton.prototype.elTag = 'button';

module.exports = InputButton;
