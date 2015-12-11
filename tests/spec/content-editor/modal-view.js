'use strict';

var $ = require('jquery');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
require('jasmine-jquery');

describe('streamhub-input/javascript/content-editor/modal-view', function () {
  it('is an constructor', function () {
    expect(typeof (ModalContentEditor)).toBe('function');
  });

  describe('when constructed', function () {
    var commentInput;

    beforeEach(function () {
      sandbox();
      commentInput = new ModalContentEditor({
        el: $('#sandbox')[0]
      });
    });

    afterEach(function () {
      commentInput.destroy();
    });

    it('can launchModal(), then returnModal()', function () {
      expect(typeof (commentInput.launchModal)).toBe('function');
      expect(typeof (commentInput.returnModal)).toBe('function');

      expect(function () {
        commentInput.launchModal();
        commentInput.returnModal();
      }).not.toThrow();
    });

    it('has a template()', function () {
      expect(typeof (commentInput.template)).toBe('function');
      expect(typeof (commentInput.template())).toBe('string');
    });

    it('reset()s and returnModal()s when it _handlePostSuccess()', function () {
      commentInput.render();
      spyOn(commentInput, 'returnModal').andCallThrough();
      spyOn(commentInput, 'reset');

      commentInput._handlePostSuccess();

      expect(commentInput.returnModal).toHaveBeenCalled();
      expect(commentInput.reset).toHaveBeenCalled();
    });
  });
});
