'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var ContentEditor = require('streamhub-input/javascript/content-editor/view');
var inherits = require('inherits');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var ModalInputCommand= require('streamhub-input/javascript/modal/modal-input-command');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/content-editor/view', function () {
    it('is an constructor', function () {
        expect(typeof(ContentEditor)).toBe('function');
    });

    describe('when constructed', function () {
        var commentInput;
        var writable;
        beforeEach(function () {
            sandbox();
            commentInput = new ContentEditor({
                el: $('#sandbox')[0]
            });
            writable = new Writable();
            writable._write = function () {};
        });

        afterEach(function () {
            commentInput.destroy();
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

            it('reset()s after successfully submitting a comment', function () {
                spyOn(commentInput, 'reset').andCallThrough();
                commentInput._handlePostSuccess();
                expect(commentInput.reset).toHaveBeenCalled();
            });

            it('reset()s and when it _handlePostSuccess()', function () {
                spyOn(commentInput, 'reset');
                commentInput._handlePostSuccess({});
                expect(commentInput.reset).toHaveBeenCalled();
            });

            it('disables the post button on submit and reenables when the content is posted', function () {
                commentInput.pipe(writable);
                commentInput.sendPostEvent({
                    body: 'Batman',
                });
                expect(commentInput._postButton._disabled).toBeTruthy();
                commentInput._handlePostSuccess();
                expect(commentInput._postButton._disabled).not.toBeTruthy();
                commentInput.unpipe(writable);
            });

            it('has a .$textareaEl and .$postEl', function () {
                expect(commentInput.$textareaEl).toBeTruthy();
                expect(commentInput.$postEl).toBeTruthy();
            });

            it('sets the user\'s display name when there is a user', function () {
                var name = 'Batman';
                commentInput._user = {
                    get: function () { return name }
                }
                commentInput.render();
                expect(commentInput.$('.lf-name').html()).toEqual(name);
            });

            it('unsets the user\'s display name when there is no user', function () {
                commentInput._user = null;
                commentInput.render();
                expect(commentInput.$('.lf-name').html()).toEqual('');
            });


            describe('with an opts.destination', function () {
                beforeEach(function () {
                    commentInput = new ContentEditor({
                        destination: writable,
                        el: $('#sandbox')[0],
                    });

                    commentInput.render();
                });

                it('should auto-pipe', function () {
                    var spy = spyOn(writable, 'write');
                    commentInput.writeToDestination('Batman', 'Batman');
                    expect(writable.write).toHaveBeenCalledWith('Batman', 'Batman');
                });
            });

            describe('with authentication', function () {
                beforeEach(function () {
                    commentInput = new ContentEditor({
                        el: $('#sandbox')[0],
                    });

                    // Lazy man's mock
                    commentInput._authCmd = new Command(commentInput._postCmd);
                    commentInput.render();
                });

                it('does not trigger a post event when the user is not authenticated', function () {
                    commentInput._authCmd.disable();
                    var spy = spyOn(commentInput, 'buildPostEventObj').andCallThrough();
                    commentInput.delegateEvents();
                    commentInput._postButton.$el.click();
                    expect(spy).not.toHaveBeenCalled();
                });

                it('triggers a post event when the user is authenticated', function () {
                    commentInput._authCmd.enable();
                    var spy = spyOn(commentInput, 'buildPostEventObj').andCallThrough();
                    commentInput.delegateEvents();
                    commentInput._postButton.$el.click();
                    expect(spy).toHaveBeenCalled();
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
                    },
                    mediaEnabled: true
                };

                commentInput = new ContentEditor(opts);
                commentInput.render();
            });

            afterEach(function () {
                commentInput.destroy();
            });

            it('assigns opts.i18n to ._18n', function () {
                expect(commentInput._i18n.emptyText).toBe(testString);
            });

            it('renders an upload icon', function () {
                expect(commentInput.$el.has(commentInput._uploadButton.$el)).toBeTruthy();
            });

            it('renders an attachment list', function () {
                expect(commentInput.$el.has(commentInput._attachmentsList.$el)).toBeTruthy();
            });
        });
    });
});
