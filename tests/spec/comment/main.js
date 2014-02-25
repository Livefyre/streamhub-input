'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var debug = require('streamhub-sdk/debug');
var Edit = require('comment');
var inherits = require('inherits');
var InputCommand = require('input/command');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var LaunchableModal = require('modal/abstract/launchable-modal');
var ModalInputCommand= require('modal/modal-input-command');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('comment', function () {
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
            var classes = commentInput.class.split(' ');
            expect(classes).toContain('lf-edit');
        });

        it('has default i18n', function () {
            expect(typeof(commentInput._i18n)).toBe('object');
            expect(typeof(commentInput._i18n.emptyText)).toBe('string');
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

        it('reset()s and returnModal()s when it handlePostSuccess()', function () {
            spyOn(commentInput, 'returnModal').andCallThrough();
            spyOn(commentInput, 'reset');

            commentInput.handlePostSuccess({});

            expect(commentInput.returnModal).toHaveBeenCalled();
            expect(commentInput.reset).toHaveBeenCalled();
        });

        it('logs for showError()', function () {
            if (debug.enabled('comment')) {
                spyOn(console, 'log').andCallThrough();

                commentInput.showError('error');

                waitsFor(function () {
                    return console.log.wasCalled;
                }, 'console.log to get called', 200);
                runs(function () {
                    expect(console.log).toHaveBeenCalled();
                });
            } else {
                throw 'This test requires debugging enabled for comment';
            }
        });

        it('logs for handlePostFailure()', function () {
            if (debug.enabled('comment')) {
                spyOn(console, 'log').andCallThrough();

                commentInput.handlePostFailure({});

                waitsFor(function () {
                    return console.log.wasCalled;
                }, 'console.log to get called', 200);
                runs(function () {
                    expect(console.log).toHaveBeenCalled();
                });
            } else {
                throw 'This test requires debugging enabled for comment';
            }
        });

        it('logs for handlePostSuccess()', function () {
            if (debug.enabled('comment')) {
                spyOn(console, 'log').andCallThrough();

                commentInput.handlePostSuccess({});

                waitsFor(function () {
                    return console.log.wasCalled;
                }, 'console.log to get called', 200);
                runs(function () {
                    expect(console.log).toHaveBeenCalled();
                });
            } else {
                throw 'This test requires debugging enabled for comment';
            }
        });

        describe('and rendered', function () {
            var testString = "Test comment"
            beforeEach(function () {
                commentInput.render();
            });

            it('can getInput() from its view', function () {
                commentInput.$textareaEl.val(testString);
                expect(commentInput.getInput().body).toBe(testString);
            });

            it('can _validate(data) data', function () {
                expect(commentInput._validate({})).toBe(false);
                expect(commentInput._validate({body: testString})).toBe(true);
            });

            it('can transform data into Content with _inputToContent(data)', function () {
                var content = commentInput._inputToContent({body: testString});
                expect(content.body).toBe(testString);
            });

            it('can reset() its view', function () {
                commentInput.$textareaEl.val(testString);
                expect(commentInput.$textareaEl.val()).toBe(testString);

                commentInput.reset();
                expect(commentInput.$textareaEl.val()).toBe('');
            });

            xit('can showError(msg) in its view', function () {
                throw 'TODO (joao) Pending design input!';
            });

            it('can be read() from', function () {
                commentInput.$textareaEl.val(testString);
                expect(commentInput.$textareaEl.val()).toBe(testString);

                var readVal = commentInput.read();
                expect(readVal).toBeTruthy();
                expect(readVal.body).toBe(testString);
            });

            it('has a .$textareaEl and .$postEl', function () {
                expect(commentInput.$textareaEl).toBeTruthy();
                expect(commentInput.$postEl).toBeTruthy();
            });

            describe('with an opts.destination', function () {
                beforeEach(function () {
                    commentInput = new Edit({
                        destination: writable,
                        el: $('#sandbox')[0],
                    });

                    commentInput.render();
                });

                it('decorates .$postEl with a Button and stores it as ._postButton containing an AuthRequiredCommand wrapping an InputCommand command', function () {
                    var btn = commentInput._postButton;
                    expect(btn).toBeTruthy();
                    expect(btn._command instanceof AuthRequiredCommand).toBe(true);

                    var authCmd = btn._command;
                    expect(authCmd._command instanceof InputCommand).toBe(true);
                });

                it('sets an InputCommand with this as the source', function () {
                    var authCmd = commentInput._postButton._command;
                    var inputCmd = authCmd._command;
                    expect(inputCmd._source).toBe(commentInput);
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
            })

            it('assigns opts.destination to ._destination', function () {
                expect(commentInput._destination).toBe(writable);
            });

            it('assigns opts.i18n to ._18n', function () {
                expect(commentInput._i18n.emptyText).toBe(testString);
            });
        });
    });
});
