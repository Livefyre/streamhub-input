var Command = require('streamhub-sdk/ui/command');
var inherits = require('inherits');

'use strict';

/**
 * A command that, when executed, shows the modal version of an Input view. Requires that
 * the view implements LaunchableModal
 * @param view {LaunchableModal} View to launch as a modal
 * @param [opts] {Object}
 * @constructor
 * @extends {Command}
 */
function ModalInputCommand(view, opts) {
    opts = opts || {};
    if (!view) {
        throw 'Can\'t instantiate a ModalInputCommand without specifying a view';
    }
    function cmd() {
        view.launchModal(opts.modal);
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
