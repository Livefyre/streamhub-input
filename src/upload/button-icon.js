/**
 * @fileoverview The upload button, as a mini icon
 */
'use strict';


var inherits = require('inherits');
var UploadButton = require('streamhub-input/upload/button');

/**
 * @constructor
 * @extends {UploadButton}
 */
function UploadButtonIcon(opts) {
    opts = opts || {};
    opts.packageAs = 'attachment';
    UploadButton.call(this, opts);
};
inherits(UploadButtonIcon, UploadButton);

/** @override */
UploadButtonIcon.prototype.elClass = 'editor-upload';

/** @override */
UploadButtonIcon.prototype.elTag = 'span';

/** @override */
UploadButtonIcon.prototype.template = function () {
    return '<span class="fycon-composer-photo" />';
};

module.exports = UploadButtonIcon;
