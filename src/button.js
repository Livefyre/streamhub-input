var Button = require('streamhub-sdk/ui/button');
var inherits = require('inherits');

'use strict';

/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.input] {Pipeable} The Input source.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @constructor
 * @extends {Button}
 */
 function InputButton(command, opts) {
    opts = opts || {};
    /**
     * @type {?Pipeable}
     */
    this._input = opts.input || null;

    opts.destination && this.pipe(opts.destination);

    Button.apply(this, arguments);
};
inherits(InputButton, Button);

/** @override */
InputButton.prototype.elClass += ' input-btn';

/** @override */
InputButton.prototype.elTag = 'button';

/**
 * Pass through to button's input.
 * @param {Writable} writable
 */
InputButton.prototype.pipe = function (writeable) {
    this._input && this._input.pipe(writeable);
};

/**
 * Pass through to button's input.
 * @param {Writable} writable
 */
InputButton.prototype.unpipe = function (writeable) {
    this._input && this._input.unpipe(writeable);
};

module.exports = InputButton;
