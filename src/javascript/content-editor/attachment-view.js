'use strict';

var inherits = require('inherits');
var View = require('streamhub-sdk/view');

function AttachmentView() {
  View.apply(this, arguments);
}
inherits(AttachmentView, View);

/*
 * Ensure that the image does not render with an unreasonable aspect ratio
 * @param {string} url
 * @return {Image}
 */
AttachmentView.prototype._loadThumbnail = function (url) {
  var image = new Image();
  image.className = this.classes.THUMBNAIL;
  image.onload = this._handleImageLoaded.bind(this, image);
  image.src = url;
  return image;
};

/*
 * Chose between displaying as a imge with fixed height and scaled width,
 * or a div with fixed height and width.
 * @param {Image} image
 * @return {Element}
 */
AttachmentView.prototype._handleImageLoaded = function (image) {
  var src = image.src;
  View.prototype.render.call(this);
  if (image.height / image.width < 0.6) {
    image = document.createElement('div');
    image.className = this.classes.THUMBNAIL_CONTAINED;
    image.style.backgroundImage = 'url("' + src +'")';
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

/**
 * Return the oembed
 * @return {Object}
 */
AttachmentView.prototype.getOembed = function () {
  return this.opts.oembed;
};

/** @override */
AttachmentView.prototype.render = function () {
  this.$el.hide();
  var loaders = {
    photo: this.opts.oembed.url,
    video_promise: this.opts.oembed.thumbnail_url
  };
  var type = this.opts.oembed.type;

  if (type in loaders) {
    return this._loadThumbnail(loaders[type]);
  }
  throw new Error('Unknown oembed type: ' + type);
};

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

module.exports = AttachmentView;
