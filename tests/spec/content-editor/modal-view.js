'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var ModalContentEditor = require('streamhub-input/javascript/content-editor/modal-view');
var inherits = require('inherits');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var ModalInputCommand= require('streamhub-input/javascript/modal/modal-input-command');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/content-editor/modal-view', function () {
    it('is an constructor', function () {
        expect(typeof(ModalContentEditor)).toBe('function');
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
            expect(typeof(commentInput.launchModal)).toBe('function');
            expect(typeof(commentInput.returnModal)).toBe('function');

            expect(function () {
                commentInput.launchModal();
                commentInput.returnModal();
            }).not.toThrow();
        });

        it('has a template()', function () {
            expect(typeof(commentInput.template)).toBe('function');
            expect(typeof(commentInput.template())).toBe('string');
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
