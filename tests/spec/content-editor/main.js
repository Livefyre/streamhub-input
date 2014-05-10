'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var Edit = require('streamhub-input/content-editor');
var inherits = require('inherits');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var LaunchableModal = require('streamhub-input/modal/launchable-modal');
var ModalInputCommand= require('streamhub-input/modal/modal-input-command');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('streamhub-input/content-editor', function () {
    it('is an constructor that subclasses Editor and implements Input and LaunchableModal', function () {
        expect(typeof(Edit)).toBe('function');
        //TODO (joao) Test for abstract implementations
    });

    describe('when constructed', function () {
        var commentInput;
        var writable;
        beforeEach(function () {
            sandbox();
            commentInput = new Edit({
                el: $('#sandbox')[0]
            });
            writable = new Writable();
        });

        afterEach(function () {
            commentInput.destroy();
        })

        it('returns null when read() from before rendering', function () {
            expect(commentInput.read()).toBeNull();
        });

        it('can launchModal(), then returnModal()', function () {
            expect(typeof(commentInput.launchModal)).toBe('function');
            expect(typeof(commentInput.returnModal)).toBe('function');

            expect(function () {
                commentInput.launchModal();
                commentInput.returnModal();
            }).not.toThrow();
        });

        it('adds the class "lf-edit"', function () {
            var classes = commentInput.elClass.split(' ');
            expect(classes).toContain('lf-edit');
        });

        it('has default i18n', function () {
            expect(typeof(commentInput._i18n)).toBe('object');
            expect(typeof(commentInput._i18n.PLACEHOLDERTEXT)).toBe('string');
        });

        it('has a elTag of "article"', function () {
            expect(commentInput.elTag).toBe('article');
        });

        it('has a template()', function () {
            expect(typeof(commentInput.template)).toBe('function');
            expect(typeof(commentInput.template())).toBe('string');
        });

        it('has a modalTemplate()', function () {
            expect(typeof(commentInput.modalTemplate)).toBe('function');
            expect(typeof(commentInput.modalTemplate())).toBe('string');
        });

        it('reset()s and returnModal()s when it _handlePostSuccess()', function () {
            spyOn(commentInput, 'returnModal').andCallThrough();
            spyOn(commentInput, 'reset');

            commentInput._handlePostSuccess({});

            expect(commentInput.returnModal).toHaveBeenCalled();
            expect(commentInput.reset).toHaveBeenCalled();
        });

        describe('and rendered', function () {
            var testString = "Test comment"
            beforeEach(function () {
                commentInput.render();
            });

            it('can buildPostEventObj() from its view', function () {
                commentInput.$textareaEl.val(testString);
                expect(commentInput.buildPostEventObj().body).toBe(testString);
            });

            it('can _validate(data) data', function () {
                expect(commentInput._validate({})).toBe(false);
                expect(commentInput._validate({body: testString, attachments: []})).toBe(true);
            });

            it('can reset() its view and does so after submitting a comment', function () {
                commentInput.$textareaEl.val(testString);
                expect(commentInput.$textareaEl.val()).toBe(testString);

                commentInput.reset();
                expect(commentInput.$textareaEl.val()).toBe('');
            });

            xit('reset()s after successfully submitting a comment', function () {
                throw 'TODO (joao) Implement this!';
            });

            xit('can showError(msg) in its view', function () {
                throw 'TODO (joao) Pending design input!';
            });

            it('has a .$textareaEl and .$postEl', function () {
                expect(commentInput.$textareaEl).toBeTruthy();
                expect(commentInput.$postEl).toBeTruthy();
            });

            xit('sets the user\'s display name on "login"', function () {
                throw 'TODO (joao) Implement this!';
            });

            xit('gets the user info when delegate is set', function () {
                throw 'TODO (joao) Implement this!';
            });

            describe('with an opts.destination', function () {
                beforeEach(function () {
                    commentInput = new Edit({
                        destination: writable,
                        el: $('#sandbox')[0],
                    });

                    commentInput.render();
                });
            });
        });

        describe('with additional opts', function() {
            var opts;
            var testString = 'Type something here';
            beforeEach(function () {
                sandbox();
                opts = {
                    destination: writable,
                    el: $('#sandbox')[0],
                    i18n : {
                        emptyText: testString
                    }
                };

                commentInput = new Edit(opts);
            });

            afterEach(function () {
                commentInput.destroy();
            });

            it('assigns opts.i18n to ._18n', function () {
                expect(commentInput._i18n.emptyText).toBe(testString);
            });
        });
    });
});
