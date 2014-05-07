var inherits = require('inherits');
var ListView = require('streamhub-sdk/views/list-view');
var OembedView = require('streamhub-input/comment/attachment-view');

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

AttachmentListView.prototype._handleRemove = function (ev) {
    var id = ev.target.parentNode.getAttribute('data-lf-id');
    this.remove(this._viewMap[id]);
    delete this._viewMap[id];
};

/** @override */
AttachmentListView.prototype.add = function (oembed, attachment) {
    var newView = new OembedView({
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

/** @override */
AttachmentListView.prototype.elClass = 'lf-attachment-list-view';

/** @override */
AttachmentListView.prototype.events = {
    'click .content-attachment-discard': '_handleRemove'
};

// docs
AttachmentListView.prototype.getAttachments = function () {
    var attachments = [];
    for (var i = 0; i < this.views.length; i++) {
        attachments.push(this.views[i].opts.oembed);
    }
    return attachments;
};

module.exports = AttachmentListView;
