'use strict';

var inherits = require('inherits');
var View = require('streamhub-sdk/view');

function AttachmentView() {
  View.apply(this, arguments);
}
inherits(AttachmentView, View);

/** @enum {string} */
AttachmentView.prototype.classes = {
  THUMBNAIL: 'lf-attachment-thumbnail',
  THUMBNAIL_CONTAINED: 'lf-attachment-thumbnail-contained'
};

/** @override */
AttachmentView.prototype.elClass = 'lf-attachment';

/** @override */
AttachmentView.prototype.template = require('hgn!streamhub-input/templates/attachment');

/**
 * Return the oembed
 * @return {Object}
 */
AttachmentView.prototype.getOembed = function () {
  return this.opts.oembed;
};

/**
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
    image.style.backgroundImage = 'url("' + src + '")';
  }
  this.$el.append(image);
  this.$el.show();
  return image;
};

/**
 * Load a thumbnail for the provided url and type. If the URL is truthy, use it
 * to load within an img tag. If the URL is falsy, load a span and set a class
 * on it so that a type-specific icon can be shown.
 * @param {string} url
 * @param {string} type
 * @return {Element}
 */
AttachmentView.prototype._loadThumbnail = function (url, type) {
  // URL exists for photo and video_promise types, but not for audio_promise.
  // Only do image related things if there is a URL.
  if (url) {
    var image = new Image();
    image.className = this.classes.THUMBNAIL;
    image.onload = this._handleImageLoaded.bind(this, image);
    image.src = url;
    return image;
  }

  // No valid URL value, so create a span element and let it use CSS to show
  // a thumbnail based on the type.
  var span = document.createElement('span');
  span.className = [this.classes.THUMBNAIL, this.classes.THUMBNAIL + '-' + type].join(' ');
  View.prototype.render.call(this);
  this.$el.append(span);
  this.$el.css('display', 'inline-block');
  return span;
};

/** @override */
AttachmentView.prototype.render = function () {
  this.$el.hide();
  var embedThumbnailMap = {
    audio_promise: null,
    photo: this.opts.oembed.url,
    video_promise: this.opts.oembed.thumbnail_url
  };
  var oembedType = this.opts.oembed.type;

  if (oembedType in embedThumbnailMap) {
    return this._loadThumbnail(embedThumbnailMap[oembedType], oembedType);
  }
  throw new Error('Unknown oembed type: ' + oembedType);
};

module.exports = AttachmentView;
