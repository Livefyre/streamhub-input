var ModalView = require('streamhub-sdk/modal');
var util = require('streamhub-input/javascript/util');

'use strict';

/**
 * A view that can be displayed and interacted with in an otherwise generic modal.
 * @constructor
 */
function LaunchableModal() {};

/**
 * Displays and operates this view as a modal.
 * @param [callback] {function(err: Object, data: Object)}
 *      Called after a successful interaction
 */
LaunchableModal.prototype.launchModal = function(callback) {
    /**
     * Function to call after a successful interaction.
     * @type {!function(err: Object, data: Object)}
     */
    this._callback = callback || util.nullFunction;

    /**
     * Modal representation of this view.
     * @type {!ModalView}
     */
    this._modal = this._modal || new ModalView();
    this._modal.show(this, true);  // Will .render() and stack
};

/**
 * Called when the modal view has competed its task and can be closed/hidden.
 * @param [err] {Object}
 * @param [data] {Object}
 */
LaunchableModal.prototype.returnModal = function (err, data) {
    this._returnModal(err, data);
};

/**
 * Called by returnModal to hand closing necessities.
 * @param [err] {Object}
 * @param [data] {Object}
 * @private
 */
LaunchableModal.prototype._returnModal = function (err, data) {
    if (!this._modal || !this._callback) {
        return;
    }

    this._callback(err, data);
    this._callback = null;
    this._modal.$el.trigger('hideModal.hub');  // Will _modal.hide()
};

module.exports = LaunchableModal;
