var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('modal/modal-input-command');
var Input = require('input');
var LaunchableModal = require('modal/abstract/launchable-modal');
var util = require('streamhub-sdk/util');
var Writable = require('stream/writable');

'use strict';

/**
 * A command that, when executed, shows the modal version of an Input view. Requires that
 * the view implements LaunchableModal
 * @param view {LaunchableModal} View to launch as a modal
 * @param [opts] {Object}
 * @param [opts.callback] {function(err: Object, data: Object)}
 *      Called when the modal view has accomplished its goal.
 * @param [opts.fn] {function} Option function to replace the default function.
 * @constructor
 * @extends {AuthRequiredCommand}
 */
var ModalInputCommand = function(view, opts) {
    opts = opts || {};
    fn = opts.fn || cmd;
    Command.call(this, fn, opts);

    if (!view) {
        throw 'Can\'t instanciate a ModalInputCommand without specifying a view'
    }
    
    /**
     * The Input instance that will be launched into a modal
     * @type {!Input}
     */
    this.view = view;
    
    this.callback = opts.callback || this.callback;
    
    var self = this;
    function cmd(clbk) {
        self.view.launchModal(clbk || self.callback || util.nullFunction);
    }
};
inherits(ModalInputCommand, Command);

/** @override */
ModalInputCommand.prototype.canExecute = function () {
    return (this.view) ? true : false;
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
