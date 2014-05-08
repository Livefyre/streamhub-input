var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var AttachmentView = require('streamhub-input/content-editor/attachment-view');

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
    var id = ev.target.parentNode.getAttribute('data-lf-id');
    this.remove(this._viewMap[id]);
    delete this._viewMap[id];
};

/** @override */
AttachmentListView.prototype.add = function (oembed, attachment) {
    var newView = new AttachmentView({
        oembed: oembed
    });
    newView.render();
    newView.$el.attr('data-lf-id', newView.uid);
    this._viewMap[newView.uid] = newView;
    // Add to DOM
    this.views.splice(0, 0, newView);
    this._insert(newView);
    this.emit('added', newView);
    return newView;
};

/**
 * Clear all currently displayed attachments
 */
AttachmentListView.prototype.clearAttachments = function () {
    for (var i = 0; i < this.views.length; i++) {
        this.remove(this.views[i]);
    }
    this._viewMap = {};
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
