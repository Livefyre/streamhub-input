'use strict';

var $ = require('jquery');
var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');
var CompositeView = require('view/composite-view');
var inherits = require('inherits');
var Writable = require('stream/writable');

/**
 * @contructor
 * @extends {ListView}
 */
function AttachmentListView() {
    CompositeView.apply(this, arguments);
}
inherits(AttachmentListView, CompositeView);


/** @enum {string} */
AttachmentListView.EVENTS = {
    ADD: 'addAttachment',
    REMOVE: 'removeAttachment'
};

/** @enum {string} */
AttachmentListView.prototype.classes = {
    DATA_ID: 'data-lf-id',
    DISCARD_X: 'lf-attachment-discard'
};

/** @override */
AttachmentListView.prototype.elClass = 'lf-attachment-list-view';

/** @override */
AttachmentListView.prototype.events = (function () {
    var events = {};
    events['click .' + AttachmentListView.prototype.classes.DISCARD_X] = '_handleRemove';
    return events;
})();

/**
 * @param {Event} ev
 * @private
 */
AttachmentListView.prototype._handleRemove = function (ev) {
    var id = Number(ev.target.parentNode.getAttribute(this.classes.DATA_ID));
    var childView;
    for (var i = 0; i < this._childViews.length; i++) {
        if (this._childViews[i].$el.data('lf-id') === id) {
            childView = this._childViews[i];
            break;
        }
    }

    if (childView) {
        this.remove(childView);
        this.emit(AttachmentListView.EVENTS.REMOVE, {count: this._childViews.length});
    }
};

/** @override */
AttachmentListView.prototype.add = function (content) {
    var newView = new AttachmentView({
        oembed: content.attachments[0]
    });
    newView.$el.attr(this.classes.DATA_ID, newView.uid);

    newView = CompositeView.prototype.add.call(this, newView, {render: true});
    this.emit(AttachmentListView.EVENTS.ADD, {count: this._childViews.length});
    return newView;
};

/**
 * Fill in method because this is supposed to be writable
 * @param {View} view
 */
AttachmentListView.prototype.write = function (view) {
    this.add(view);
};

/**
 * Clear all currently displayed attachments
 */
AttachmentListView.prototype.clearAttachments = function () {
    while (this._childViews.length) {
        this.remove(this._childViews[0]);
    }
};

/**
 * Get all the attachments in view
 * @return {Array.<Oembed>}
 */
AttachmentListView.prototype.getAttachments = function () {
    return $.map(this._childViews, function (val) {
        return val.getOembed();
    });
};

module.exports = AttachmentListView;
