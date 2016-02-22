'use strict';

var AttachmentView = require('streamhub-input/javascript/content-editor/attachment-view');

describe('streamhub-input/javascript/content-editor/attachment-view', function () {
  var attachmentView;
  var url = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';

  beforeEach(function () {
    attachmentView = new AttachmentView({
      oembed: {
        url: url,
        type: 'photo'
      }
    });
  });

  afterEach(function () {
    attachmentView.destroy();
  });

  describe('#_loadThumbnail', function () {
    it('should render oembed urls', function () {
      var image = attachmentView._loadThumbnail(url);
      expect(image.getAttribute('src')).toEqual(url);
    });

    it('should add an image for normal aspect ratio', function () {
      var image = attachmentView._loadThumbnail(url);
      image.height = 40;
      image.width = 40;
      image = attachmentView._handleImageLoaded(image);
      expect(image.className).toEqual(attachmentView.classes.THUMBNAIL);
      expect(image.tagName).toEqual('IMG');
    });

    it('should contain an image with a crazy aspect ratio', function () {
      var image = attachmentView._loadThumbnail(url);
      image.height = 40;
      image.width = 1000;
      image = attachmentView._handleImageLoaded(image);
      expect(image.className).toEqual(attachmentView.classes.THUMBNAIL_CONTAINED);
      expect(image.tagName).toEqual('DIV');
    });
  });

  it('should render thumb views for photos', function () {
    var photoDiv;
    var photoView;

    runs(function () {
      photoDiv = document.createElement('div');
      photoView = new AttachmentView({
        oembed: {
          url: url,
          type: 'photo'
        }
      });
      photoView.setElement(photoDiv);
      photoView.render();
    });

    waitsFor(function () {
      return photoView.$('.lf-attachment-thumbnail').length > 0;
    }, 'Photo should be rendered', 10000);

    runs(function () {
      var thumb = photoView.$('.lf-attachment-thumbnail')[0];
      expect(thumb.nodeName).toBe('IMG');
      expect(thumb.src).toBe(url);
    });
  });

  it('should render thumb views for videos', function () {
    var videoDiv;
    var videoView;

    runs(function () {
      videoDiv = document.createElement('div');
      videoView = new AttachmentView({
        oembed: {
          thumbnail_url: url,
          type: 'video_promise'
        }
      });

      videoView.setElement(videoDiv);
      videoView.render();
    });

    waitsFor(function () {
      return videoView.$('.lf-attachment-thumbnail').length > 0;
    }, 'Video thumb should be rendered', 10000);

    runs(function () {
      var thumb = videoView.$('.lf-attachment-thumbnail')[0];
      expect(thumb.nodeName).toBe('IMG');
      expect(thumb.src).toBe(url);
    });
  });

  it('throws an error if trying to render unknown oembed type', function () {
    var div = document.createElement('div');
    var view = new AttachmentView({
      oembed: {
        thumbnail_url: url,
        type: 'broken'
      }
    });

    view.setElement(div);
    expect(view.render).toThrow();
  });
});
