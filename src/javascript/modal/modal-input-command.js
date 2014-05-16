var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');
var util = require('streamhub-input/javascript/util');

'use strict';

/**
 * A command that, when executed, shows the modal version of an Input view. Requires that
 * the view implements LaunchableModal
 * @param view {LaunchableModal} View to launch as a modal
 * @param [opts] {Object}
 * @param [opts.callback] {function(err: Object, data: Object)}
 *      Called when the modal view has accomplished its goal.
 * @constructor
 * @extends {Command}
 */
function ModalInputCommand(view, opts) {
    opts = opts || {};
    if (!view) {
        throw 'Can\'t instanciate a ModalInputCommand without specifying a view';
    }
    var self = this;
    function cmd(cb) {
        self.view.launchModal(cb || opts.callback || util.nullFunction);
    }

    /**
     * The Input instance that will be launched into a modal
     * @type {!Input}
     */
    this.view = view;

    Command.call(this, cmd, opts);
}
inherits(ModalInputCommand, Command);

/** @override */
ModalInputCommand.prototype.canExecute = function () {
    return (this.view) ? true : false;
};

module.exports = ModalInputCommand;
