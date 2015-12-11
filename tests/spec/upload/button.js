'use strict';

var $ = require('jquery');
var InputButton = require('streamhub-input/javascript/button');
var Upload = require('streamhub-input/javascript/upload/view');
var UploadButton = require('streamhub-input/javascript/upload/button');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/upload/button', function () {
  var upldBtn;

  it('is a constructor that extends InputButton', function () {
    expect(typeof (UploadButton)).toBe('function');

    upldBtn = new UploadButton();
    expect(upldBtn instanceof InputButton).toBe(true);
  });

  describe('when constructed', function () {
    var opts;

    var writable;
    var testString = 'data sample';

    beforeEach(function () {
      opts = $.extend({}, Upload.DEFAULT_OPTS);
      upldBtn = new UploadButton();
      writable = new Writable();
      writable._write = function () {};
      spyOn(writable, '_write').andCallFake(function (data, clbk) {
        clbk();
      });
    });

    it('can pipe data to a writable', function () {
      upldBtn.pipe(writable);
      upldBtn._input.writeToDestination(testString);
      expect(writable._write).toHaveBeenCalled();
    });

    describe('with opts.destination', function () {
      beforeEach(function () {
        upldBtn = new UploadButton({
          authRequired: false,
          destination: writable
        });
      });

      it('.pipe()s to the destination', function () {
        upldBtn._input.writeToDestination('something');
        expect(writable._write).toHaveBeenCalled();
      });

      describe('and render()\'d', function () {
        beforeEach(function () {
          opts.authRequired = false;
          opts.pick.debug = true;
          opts.destination = writable;
        });

        it('can be clicked to launch an Upload modal', function () {
          runs(function () {
            upldBtn.render();
            upldBtn.$el.click();
          });

          waitsFor(function () {
            return window.filepicker && $('#picker').length;
          });

          runs(function () {
            var picker = $('#picker');
            expect(picker).toBeTruthy();
          });
        });
      });
    });
  });
});
