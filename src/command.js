var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('input/command');
var Readable = require('stream/readable');
var Util = require('streamhub-sdk/util');
var Writable = require('stream/writable');

'use strict';

/**
 * 
 * @param source {!Readable} Object that can be read from.
 *          Function that returns comment data as Content.
 * @param [opts] {Object}
 * @param [opts.callback] {function(err: Object, data: Object} Callback after attempting to post comment.
 * @param [opts.fn] {function} Optional function to replace the default function.
 * @constructor
 * @extends {AuthRequiredCommand}
 */
var InputCommand = function(source, opts) {
    opts = opts || {};
    fn = opts.fn || cmd;
    Command.call(this, fn);
    
    /**
     * The source to read() from.
     * @type {!Readable}
     * @protected
     */
    this._source = source;
    
    if (!this._source) {
        this.disable();
        throw 'A source and destination are required when constructing a InputCommand.';
    }
    
    this.callback = opts.callback || this.callback;
    
    var self = this;
    function cmd(clbk) {
        var data = self._source.getInput();
        data && self._source.emit('data', data);
    }
};
inherits(InputCommand, Command);

/** @override */
InputCommand.prototype.canExecute = function () {
    if (!Command.prototype.canExecute.apply(this, arguments)) {
        return false;
    }
    
    if (!this._source) {
        log('Can\'t execute without this._source.');
        return false;
    }
    
    return true;
};

/**
 * Handle response from posting comment.
 * Custom implementation is recommended, either by specifying opts.callback
 * during construction or by overriding this method.
 * @param [err] {Object}
 * @param [data] {Object}
 */
InputCommand.prototype.callback = function callback(err, data) {
    //Implementation isn't necessary, but recommended in most cases.
    log('callback() was called without a practical implementation.');
};

module.exports = InputCommand;
