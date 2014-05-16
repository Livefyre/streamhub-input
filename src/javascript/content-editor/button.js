var inherits = require('inherits');
var InputButton = require('streamhub-input/javascript/button');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
var ModalInputCommand = require('streamhub-input/javascript/modal/modal-input-command');

'use strict';

/**
 *
 * @param [opts] {Object}
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @param [opts.mediaEnabled] {boolean} Are media uploads allowed?
 * @constructor
 * @extends {InputButton}
 */
function ContentEditorButton(opts) {
    opts = opts || {};
    this._i18n = $.extend(true, {}, this._i18n, (opts._i18n || {}));
    var input = new ModalContentEditor({
        mediaEnabled: opts.mediaEnabled
    });
    var command = new ModalInputCommand(input);

    InputButton.call(this, command, {
        el: opts.el,
        input: opts.input || input,
        destination: opts.destination,
        authRequired: opts.authRequired
    });
}
inherits(ContentEditorButton, InputButton);

/** @enum {string} */
ContentEditorButton.prototype._i18n = {
    POST: 'Post Your Comment'
};

/** @override */
ContentEditorButton.prototype.template = function () {
    return this._i18n.POST
};

/**
 * @override
 * @type {string}
 */
ContentEditorButton.prototype.elClass += ' comment-btn';

module.exports = ContentEditorButton;
