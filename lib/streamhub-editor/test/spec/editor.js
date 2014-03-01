var Editor = require('streamhub-editor/editor');
var expect = require('chai').expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');

describe('streamhub-editor/editor', function() {
    var div, postBtnEl, view;

    // The editor class doesn't have a template by default, but add one now so
    // that we can run some test cases.
    Editor.prototype.template = require('hgn!templates/editor');

    beforeEach(function() {
        div = document.createElement('div');
        view = new Editor({
            el: div
        });
        view.render();
        postBtnEl = view.$('.' + view.classes.POST_BTN);
    });

    it('should load with a post button', function() {
        expect(postBtnEl).to.be.visible;
    });

    it('should trigger an event when the post button is clicked', function() {
        view.sendPostEvent = function(){};
        view.$textareaEl.val('test');
        var clickSpy = sinon.spy(view, 'handlePostBtnClick');
        var sendSpy = sinon.spy(view, 'sendPostEvent');
        view.delegateEvents();
        postBtnEl.click();
        assert(clickSpy.called);
        assert(sendSpy.called);
    });

    it('should validate the text in the textarea', function() {
        view.showError = function(){};
        expect(view.validate({body: ''})).to.be.false;
        expect(view.validate({body: 'test'})).to.be.true;
    });
});
