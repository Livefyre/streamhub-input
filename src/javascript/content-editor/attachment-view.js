var inherits = require('inherits');
var View = require('streamhub-sdk/view');

'use strict';

function AttachmentView () {
    View.apply(this, arguments);
}
inherits(AttachmentView, View);

/* Ensure that the image does not render with an unreasonable aspect ratio */
AttachmentView.prototype._loadImage = function () {
    var image = new Image();
    image.className = this.classes.THUMBNAIL;
    image.onload = this._handleImageLoaded.bind(this, image);
    image.src = this.opts.oembed.url;
};

/*
 * Chose between displaying as a imge with fixed height and scaled width,
 * or a div with fixed height and width.
 */
AttachmentView.prototype._handleImageLoaded = function (image) {
    View.prototype.render.call(this);
    if (image.height / image.width < 0.5) {
        var div = document.createElement('div');
        div.className = this.classes.THUMBNAIL_CONTAINED;
        div.style = 'background-image: ' + this.opts.oembed.url;
        return this.$el.append(div);
    }
    this.$el.append(image);
};

/** @enum {string} */
AttachmentView.prototype.classes = {
    THUMBNAIL: 'lf-attachment-thumbnail',
    THUMBNAIL_CONTAINED: 'lf-attachment-thumbnail-contained'
};

/** @override */
AttachmentView.prototype.elClass = 'lf-attachment';

/** @override */
AttachmentView.prototype.render = function () {
    this._loadImage();
};

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

module.exports = AttachmentView;
