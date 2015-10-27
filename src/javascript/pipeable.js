'use strict';

/**
 * An input specific implementation of a readable that actively writes new content to a destination.
 * @param [opts] {Object}
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 */
function Pipeable(opts) {
    opts = opts || {};
    this._destination = opts.destination || null;
}

/**
 * @param {Writable} writable
 */
Pipeable.prototype.pipe = function (writable) {
    this._destination = writable;
};

/**
 * Set the destination to null
 */
Pipeable.prototype.unpipe = function () {
    this._destination = null;
};

/**
 * @param {Object} data
 * @param {function(?Error, Object)} cb
 */
Pipeable.prototype.writeToDestination = function (data, cb) {
    if (!this._destination) {
        throw 'No destination to write to';
    }
    this._destination.write(data, cb);
};

module.exports = Pipeable;
