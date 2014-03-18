var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('streamhub-sdk/input/main');
var Content = require('streamhub-sdk/content');
var EventEmitter = require('event-emitter');
var Readable = require('stream/readable');
var util = require('streamhub-sdk/util');
var View = require('streamhub-sdk/view');

'use strict';

/**
 * An Abstract for views that receive input from a user.
 * Extends Readable and is intended to be inherited parasitically by a View.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @constructor
 * @extends {Readable}
 */
var Input = function(opts) {
    opts = opts || {};
    Readable.call(this, opts);
    
    /**
     * The collection or other Writable that will receive this input.
     * @protected
     */
    this._destination = opts.destination;

    this._destination && this.pipe(this._destination);
};
inherits.parasitically(Input, Readable);
//HACK (joao) Need to upgrade inherits.parasitically
inherits.parasitically(Input, EventEmitter);

/**
 * Uses getInput() to get the user's input data.
 * @override
 * @protected
 */
Input.prototype._read = function() {
    var data = this.getInput();
    data && this.push(data);
};

/**
 * Get the user's input data. Checks it with _validate(), then converts it and returns it.
 * @returns {Object=}
 * @override
 * @protected
 */
Input.prototype.getInput = function() {
    var data = this._getRawInput();
    if (!data || !this._validate(data)) {
        return;
    }

    return this._inputToContent(data);
};

/**
 * Reads the data that has been received from the user.
 * @returns {?Object}
 */
Input.prototype._getRawInput = util.abstractFunction;

/**
 * Checks that the input from the user is valid.
 * Should call showError(msg) with
 * @param [data] {Object} Typically comes from .getInput()
 * @returns {!boolean}
 * @protected
 */
Input.prototype._validate = util.abstractFunction;

/**
 * Resets the input display, typically by clearing out the current user input
 * from the screen.
 */
Input.prototype.reset = util.abstractFunction;

/**
 * Creates and returns a Content object based on the input.
 * @param input {Object} Usually the data retrieved from getInput().
 * @returns {!Object}
 * @protected
 */
Input.prototype._inputToContent = util.abstractFunction;

/**
 * Displays an error message to the user.
 * @param msg
 */
Input.prototype.showError = util.abstractFunction;

module.exports = Input;
