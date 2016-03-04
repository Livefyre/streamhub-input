'use strict';

var inherits = require('inherits');
var template = require('hgn!streamhub-input/templates/content-success');
var View = require('view');

/**
 * Default strings for this view.
 * @enum {string}
 */
var DEFAULT_STRINGS = {
  BODY: 'Your post is being reviewed and will appear shortly.',
  BTN: 'Done',
  TITLE: 'Thank you for posting!'
};

/**
 * @constructor
 * @extends {LaunchableModal}
 * @extends {View}
 * @param {Object} opts - Configuration options.
 * @param {function()=} closeCallback - Close callback to call when `done`
 *   button is clicked.
 */
function PostSuccessView(opts, closeCallback) {
  opts = opts || {};
  View.call(this, opts);

  /**
   * Close action to take once the done button is pressed.
   * @type {function()}
   * @private
   */
  this._closeCallback = closeCallback || function() {};
}
inherits(PostSuccessView, View);

/** @override */
PostSuccessView.prototype.events = {
  'click .lf-btn': '_handleDoneClick'
};

/** @override */
PostSuccessView.prototype.template = template;

/** @override */
PostSuccessView.prototype.destroy = function () {
  this.$el.find('lf-btn').off('click', null, null);
  View.prototype.destroy.call(this);
};

/** @override */
PostSuccessView.prototype.getTemplateContext = function () {
  var _i18n = this.opts._i18n || {};
  return {
    body: _i18n.successBodyText || DEFAULT_STRINGS.BODY,
    btn: _i18n.successBtnText || DEFAULT_STRINGS.BTN,
    title: _i18n.successTitleText || DEFAULT_STRINGS.TITLE
  };
};

/**
 * Handle the done click event.
 * @private
 */
PostSuccessView.prototype._handleDoneClick = function () {
  this._closeCallback();
};

module.exports = PostSuccessView;
