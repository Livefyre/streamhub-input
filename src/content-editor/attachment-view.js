var inherits = require('inherits');
var View = require('streamhub-sdk/view');

'use strict';

function AttachmentView () {
    View.apply(this, arguments);
}
inherits(AttachmentView, View);

/** @override */
AttachmentView.prototype.getTemplateContext = function () {
    return {
        url: this.opts.oembed.url
    }
};

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

/** @override */
AttachmentView.prototype.elClass = 'lf-attachment';

module.exports = AttachmentView;
