'use strict';

var $ = require('jquery');
var SuccessView = require('streamhub-input/javascript/post-success-view');
var Upload = require('streamhub-input/javascript/upload/view');
var Writable = require('stream/writable');

require('jasmine-jquery'); // For sandbox()

describe('streamhub-input/javascript/upload/view', function () {
  var uploadInput;
  var writable;

  it('is an constructor that subclasses View and implements Input and LaunchableModal', function () {
    expect(typeof (Upload)).toBe('function');
  });

  it('loads filepicker on modal launch', function () {
    uploadInput = new Upload(Upload.DEFAULT_OPTS);

    runs(function () {
      uploadInput.launchModal();
    });

    waitsFor(function () {
      return !!window.filepicker;
    });

    runs(function () {
      expect(window.filepicker).not.toBe(undefined);
    });
  });

  it('shows the success view', function () {
    var writes = [];
    var response = [{
      mimetype: 'image/png',
      key: 'lm4pob08T1GWegOV01Jz_08_img_3976_nat_at_rockys.jpg',
      url: 'https://www.filepicker.io/api/file/P1xV1pV9QVmwoK4F5h7t'
    }];

    var opts = {};
    opts.filepicker = {
      cache: 'http://foo.bar/',
      key: '123abc',
      instance: {
        pickAndStore: function (pick, store, success) {
          success(response);
        },
        convert: function (blob, convert, store, success) {
          success(response[0]);
        }
      }
    };
    uploadInput = new Upload(opts);
    writable = new Writable();
    writable._write = function (content) {
      writes.push(content);
    };
    uploadInput.pipe(writable);

    spyOn(uploadInput, 'returnModal').andCallThrough();
    spyOn(SuccessView.prototype, 'render').andCallThrough();

    uploadInput.launchModal();

    expect(SuccessView.prototype.render).toHaveBeenCalled();
    expect(uploadInput.returnModal).not.toHaveBeenCalled();

    uploadInput._success.$el.find('button').click();
    expect(uploadInput.returnModal).toHaveBeenCalled();
  });

  describe('handles conversions of media', function () {
    var opts;

    beforeEach(function () {
      opts = $.extend({}, Upload.DEFAULT_OPTS);
    });

    it('stores and converts photos', function () {
      var writes = [];
      var converts;
      var picks;
      var response = [{
        mimetype: 'image/png',
        key: 'lm4pob08T1GWegOV01Jz_08_img_3976_nat_at_rockys.jpg',
        url: 'https://www.filepicker.io/api/file/P1xV1pV9QVmwoK4F5h7t'
      }];

      opts.filepicker = {
        cache: 'http://foo.bar/',
        key: '123abc',
        instance: {
          pickAndStore: function (pick, store, success) {
            picks = true;
            success(response);
          },

          convert: function (blob, convert, store, success) {
            converts = true;
            success(response[0]);
          }
        }
      };
      uploadInput = new Upload(opts);
      writable = new Writable();
      writable._write = function (content) {
        writes.push(content);
      };
      uploadInput.pipe(writable);
      uploadInput.launchModal();

      expect(converts).toBe(true);
      expect(picks).toBe(true);
      expect(writes.length).toBe(1);
      expect(writes[0].attachments.length).toBe(1);
      expect(writes[0].attachments[0].url).toBe('http://foo.bar/lm4pob08T1GWegOV01Jz_08_img_3976_nat_at_rockys.jpg');
    });

    it('stores videos', function () {
      var writes = [];
      var picks;
      var response = [{
        mimetype: 'video/mp4',
        key: 'foo-bar.mp4',
        url: 'https://www.filepicker.io/api/file/P1xV1pV9QVmwoK4F5h7t'
      }];

      opts.filepicker = {
        cache: 'http://foo.bar/',
        key: '123abc',
        instance: {
          pickAndStore: function (pick, store, success) {
            picks = true;
            success(response);
          }
        }
      };

      uploadInput = new Upload(opts);
      writable = new Writable();
      writable._write = function (content) {
        writes.push(content);
      };
      uploadInput.pipe(writable);
      uploadInput.launchModal();

      expect(picks).toBe(true);
      expect(writes.length).toBe(1);
      expect(writes[0].attachments.length).toBe(1);
      expect(writes[0].attachments[0].url).toBe('http://foo.bar/foo-bar.mp4');
      expect(writes[0].attachments[0].thumbnail_url).toBe('http://zor.livefyre.com/wjs/v3.0/images/video-play.png');
      expect(writes[0].attachments[0].thumbnail_width).toBe(75);
      expect(writes[0].attachments[0].thumbnail_height).toBe(56);
      expect(writes[0].attachments[0].type).toBe('video_promise');
    });

    it('throws an error for unknown oembed types', function () {
      var response = [{
        mimetype: 'some/type',
        key: 'foo-bar.xss',
        url: 'https://www.filepicker.io/api/file/P1xV1pV9QVmwoK4F5h7t'
      }];

      opts.filepicker = {
        cache: 'http://foo.bar/',
        key: '123abc',
        instance: {
          pickAndStore: function (pick, store, success) {
            success(response);
          }
        }
      };

      uploadInput = new Upload(opts);
      expect(uploadInput.launchModal).toThrow();
    });
  });

  describe('when constructed', function () {
    var opts = Upload.DEFAULT_OPTS;

    beforeEach(function () {
      window.filepicker = null;
      sandbox();
      opts.el = $('#sandbox')[0];
      uploadInput = new Upload(opts);
      writable = new Writable();
      writable._write = function () {};
      uploadInput.pipe(writable);
    });

    it('has a elTag of "iframe"', function () {
      expect(uploadInput.elTag).toBe('iframe');
    });

    it('has a getTemplateContext()', function () {
      expect(typeof (uploadInput.template)).toBe('function');
      var cxt = uploadInput.getTemplateContext();
      expect(typeof (cxt)).toBe('object');
    });

    it('has a template()', function () {
      expect(typeof (uploadInput.template)).toBe('function');
      var cxt = uploadInput.getTemplateContext();
      expect(typeof (uploadInput.template(cxt))).toBe('string');
    });

    describe('and rendered', function () {
      beforeEach(function () {
        uploadInput.render();
      });

      afterEach(function () {
        uploadInput.destroy();
      });

      xit('can showError(msg) in its view', function () {
        throw 'TODO (joao) Pending design input!';
      });
    });

    describe('with additional opts', function () {
      var opts;
      var testString = 'test value';
      beforeEach(function () {
        sandbox();
        opts = {
          destination: writable,
          el: $('#sandbox')[0],
          filepicker: {
            key: testString,
            cache: testString
          },
          name: testString
        };

        uploadInput = new Upload(opts);
      });

      afterEach(function () {
        uploadInput.destroy();
      });

      it('assigns opts.name to .name', function () {
        expect(uploadInput.name).toBe(testString);
      });

      it('assigns opts.filepicker values to ._filepickerKey and ._cacheUrl', function () {
        expect(uploadInput._filepickerKey).toBe(testString);
        expect(uploadInput._cacheUrl).toBe(testString);
      });
    });
  });
});
