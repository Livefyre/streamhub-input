var ModalView = require('streamhub-sdk/modal');

'use strict';

/**
 * A view that can be displayed and interacted with in an otherwise generic modal.
 * @constructor
 */
function LaunchableModal() {
    this._showing = false;
}

/**
 * Displays and operates this view as a modal.
 * Modal representation of this view.
 * @param {!ModalView} modal
 */
LaunchableModal.prototype.launchModal = function(modal) {
    this._modal = modal || this._modal || new ModalView();
    this._modal.show(this, true);  // Will .render() and stack
    this._showing = true;
};

/**
 * Called when the modal view has competed its task and can be closed/hidden.
 */
LaunchableModal.prototype.returnModal = function () {
    this._showing && this._modal.$el.trigger('hideModal.hub');  // Will _modal.hide()
    this._showing = false;
};

module.exports = LaunchableModal;
