var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');
var AttachmentListView = require('streamhub-input/javascript/content-editor/attachment-list-view');
var Content = require('streamhub-sdk/content');
var View = require('streamhub-sdk/view');

describe('streamhub-input/javascript/content-editor/attachment-list-view', function () {
    var attachmentListView;
    var content;
    var url = 'www.io.xxx';
    beforeEach(function () {
        attachmentListView = new AttachmentListView();
        content = new Content();
        content.attachments.push({
            url: url
        });
        attachmentListView.render();
    });

    describe('#add', function () {
        it('should add content as attachment views', function () {
            attachmentListView.add(content);
            expect(attachmentListView.views.length).toEqual(1);
            expect(attachmentListView.views[0] instanceof AttachmentView).toBeTruthy();
        });
    });

    describe('#clearAttachments', function () {
        it('destroy all attachment views', function () {
            attachmentListView.add(content);
            attachmentListView.add(content);
            attachmentListView.clearAttachments();
            expect(attachmentListView.views.length).toEqual(0);
        });
    });

    describe('#getAttachments', function () {
        it('should return all the attachments it knows about', function () {
            attachmentListView.add(content);
            var attachments = attachmentListView.getAttachments();
            expect(attachments.length).toEqual(1);
            expect(attachments[0].url).toEqual(url);
        });
    });

    describe('#_handleRemove', function () {
        it('remove the clicked attachment', function () {
            spyOn(attachmentListView, '_handleRemove').andCallThrough();
            attachmentListView.delegateEvents();
            attachmentListView.add(content);
            var view = attachmentListView.views[0];
            View.prototype.render.call(view);  // Hack b/c the image url won't ever load.
            view.$('.' + AttachmentListView.prototype.classes.DISCARD_X).click();
            expect(attachmentListView._handleRemove).toHaveBeenCalled();
            expect(attachmentListView.views.length).toEqual(0);
        });
    });

    describe('#render', function () {
        it('should insert added views', function () {
            attachmentListView.add(content);
            attachmentListView.render();
            expect(attachmentListView.$('.hub-list').children().length).toEqual(1);
        });
    });
});
