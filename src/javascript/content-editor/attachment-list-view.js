var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');

'use strict';

// docs
function AttachmentListView() {
    ListView.apply(this, arguments);

    /**
     * View ids -> views
     * @type {object}
     */
    this._viewMap = {};
}
inherits(AttachmentListView, ListView);

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

AttachmentListView.prototype._handleRemove = function (ev) {
    var id = ev.target.parentNode.getAttribute(this.classes.DATA_ID);
    this.remove(this._viewMap[id]);
    this._viewMap[id] = null;
};

/** @override */
AttachmentListView.prototype.add = function (content) {
    var newView = new AttachmentView({
        oembed: content.attachments[0]
    });
    newView.$el.attr(this.classes.DATA_ID, newView.uid);
    this._viewMap[newView.uid] = newView;

    return ListView.prototype.add.call(this, newView);
};

/**
 * Clear all currently displayed attachments
 */
AttachmentListView.prototype.clearAttachments = function () {
    while (this.views.length) {
        this.remove(this.views[0]);
    }
    this._viewMap = {};
};

/** @override */
AttachmentListView.prototype.render = function () {
    ListView.prototype.render.call(this);
    for (var i = 0; i < this.views.length; i++) {
        ListView.prototype._insert.call(this, this.views[i]);
    }
};

/**
 * Get all the attachments in view
 * @return {Array.<Oembed>}
 */
AttachmentListView.prototype.getAttachments = function () {
    var attachments = [];
    for (var i = 0; i < this.views.length; i++) {
        attachments.push(this.views[i].opts.oembed);
    }
    return attachments;
};

module.exports = AttachmentListView;
