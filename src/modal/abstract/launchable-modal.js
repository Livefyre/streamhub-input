var inherits = require('inherits');
var log = require('streamhub-sdk/debug')
        ('modal/abstract/launchable-modal');
var ModalView = require('streamhub-sdk/modal');
var Util = require('streamhub-sdk/util');

'use strict';

/**
 * A view that can be displayed and interacted with in an otherwise generic modal.
 * @param [opts] {Object}
 * @constructor
 */
var LaunchableModal = function(opts) {
    opts = opts || {};
};

/**
 * Modal template for el
 * @override
 * @param [context] {Object}
 * @returns {!string}
 */
LaunchableModal.prototype.modalTemplate = function (context) {
    return this.__proto__.template.apply(this, arguments);
};

/**
 * Displays and operates this view as a modal.
 * @param [callback] {function(err: Object, data: Object)}
 *      Called after a successful interaction
 */
LaunchableModal.prototype.launchModal = function(callback) {
    this.template = this.modalTemplate;
    
    /**
     * Function to call after a successful interaction.
     * @type {!function(err: Object, data: Object)}
     */
    this._callback = callback || Util.nullFunction;
    
    /**
     * Modal representation of this view.
     * @type {!ModalView}
     */
    this._modal = new ModalView({
        modalSubView: this
    });
    this._modal.show();//Will .render()
};

/**
 * Called when the modal view has competed its task and can be closed/hidden.
 * @param [err] {Object}
 * @param [data] {Object}
 * 
 * @protected
 */
LaunchableModal.prototype._done = function (err, data) {
    if (!this._modal) {
        return;
    }
    
    this._callback(err, data);
    this._modal.$el.trigger('hideModal.hub');//Will _modal.hide()
    //TODO (joao) Maybe destroy the current rendering and stuff?
};

module.exports = LaunchableModal;
