var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');
var View = require('streamhub-sdk/view');

describe('streamhub-input/javascript/content-editor/attachment-view', function () {
    var attachmentView;
    var url = 'www.io.xxx';
    beforeEach(function () {
        attachmentView = new AttachmentView({
            oembed: {
                url: url
            }
        });
    });

    describe('#_loadImage', function () {
        it('should render oembed urls', function () {
            var image = attachmentView._loadImage();
            expect(image.getAttribute('src')).toEqual(url);
        });

        it('should add an image for normal aspect ratio', function () {
            var image = attachmentView._loadImage();
            image.height = 40;
            image.width = 40;
            var image = attachmentView._handleImageLoaded(image);
            expect(image.className).toEqual(attachmentView.classes.THUMBNAIL);
            expect(image.tagName).toEqual('IMG');
        });

        it('should contain an image with a crazy aspect ratio', function () {
            var image = attachmentView._loadImage();
            image.height = 40;
            image.width = 1000;
            var image = attachmentView._handleImageLoaded(image);
            expect(image.className).toEqual(attachmentView.classes.THUMBNAIL_CONTAINED);
            expect(image.tagName).toEqual('DIV');
        });
    });
});
