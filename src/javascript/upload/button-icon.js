/**
 * @fileoverview The upload button, as a mini icon
 */
var inherits = require('inherits');
var UploadButton = require('streamhub-input/javascript/upload/button');

'use strict';

/**
 * @constructor
 * @extends {UploadButton}
 */
function UploadButtonIcon(opts) {
    opts = opts || {};
    UploadButton.call(this, opts);
}
inherits(UploadButtonIcon, UploadButton);

/** @override */
UploadButtonIcon.prototype.elClass = 'editor-upload';

/** @override */
UploadButtonIcon.prototype.elTag = 'span';

/** @override */
UploadButtonIcon.prototype.template = require('hgn!streamhub-input/templates/upload-button-icon');

module.exports = UploadButtonIcon;
