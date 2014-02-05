var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('modal/modal-input-command');
var Input = require('input');
var Writable = require('stream/writable');

'use strict';

/**
 * @param [fn] {function} Option function to replace the default function.
 * @param view {LaunchableModal} View to launch as a modal
 * @param [opts] {Object}
 * @param [opts.callback] {function(err: Object, data: Object)}
 *      Called when the modal view has accomplished its goal.
 * @param [opts.input} {Input} Input to use in-place of default construction.
 * @constructor
 * @extends {AuthRequiredCommand}
 */
var ModalInputCommand = function(fn, view, opts) {
    opts = opts || {};
    fn = fn || cmd;
    AuthRequiredCommand.call(this, fn, opts);
    
    /**
     * The Input instance that will be launched into a modal
     * @type {!Input}
     */
    this.view = view;
    
    this.callback = opts.callback || this.callback;
    
    var self = this;
    function cmd(clbk) {
        self.view.launchModal(clbk || self.callback || function () {});
        //TODO (joao) Replace function () {} with a util.nullFunction
    }
};
inherits(ModalInputCommand, AuthRequiredCommand);

/** @override */
ModalInputCommand.prototype.canExecute = function () {
    return (AuthRequiredCommand.prototype.canExecute.apply(this, arguments)) ? new Boolean(this.view) : false;
};

/**
 * Callback for when the view is done with whatever it's doing.
 * @param [err] {Object}
 * @param [data] {Object}
 */
ModalInputCommand.prototype.callback = function (err, data) {
    //Implementation isn't necessary, but recommended in most cases.
    log('callback() was called without a practical implementation.');
};

module.exports = ModalInputCommand;
