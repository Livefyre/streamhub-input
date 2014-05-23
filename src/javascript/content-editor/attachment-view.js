var inherits = require('inherits');
var View = require('streamhub-sdk/view');

'use strict';

function AttachmentView () {
    View.apply(this, arguments);
}
inherits(AttachmentView, View);

/* Ensure thehat the image does not render with an unreasonable aspect ratio */
AttachmentView.prototype._loadImage = function () {
    var image = new Image();
    image.className = this.classes.THUMBNAIL;
    image.onload = this._handleImageLoaded.bind(this, image);
    image.src = this.opts.oembed.url;
    return image;
};

/*
 * Chose between displaying as a imge with fixed height and scaled width,
 * or a div with fixed height and width.
 */
AttachmentView.prototype._handleImageLoaded = function (image) {
    View.prototype.render.call(this);
    if (image.height / image.width < 0.5) {
        image = document.createElement('div');
        image.className = this.classes.THUMBNAIL_CONTAINED;
        image.style.backgroundImage = 'url(' + this.opts.oembed.url +')';
    }
    this.$el.append(image);
    this.$el.show();
    return image;
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
    this.$el.hide();
    this._loadImage();
};

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

module.exports = AttachmentView;
