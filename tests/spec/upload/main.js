'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/command/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var InputCommand = require('input/command');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var LaunchableModal = require('modal/abstract/launchable-modal');
var ModalInputCommand= require('modal/modal-input-command');
var Upload = require('upload');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('upload', function () {
    it('is an constructor that subclasses View and implements Input and LaunchableModal', function () {
        expect(typeof(Upload)).toBe('function');
        //TODO (joao) Test for abstract implementations
    });
    
    describe('when constructed', function () {
        var response;
        var uploadInput;
        var writable;
        beforeEach(function () {
            sandbox();
            response = [{//@type {Array.<inkBlob>}
                // url:
                // filename:
                // mimetype:
                // size:
                key: 'randomfilename'
                // container:
                // isWriteable:
                // path: 
            }];
            var opts = Upload.DEFAULT_OPTS;
            opts.el = $('#sandbox')[0];
            uploadInput = new Upload(opts);
            writable = new Writable();
        });

        afterEach(function () {
            //uploadInput.destroy();
        })

        it('returns null when read() from before rendering', function () {
            //debugger
            var nullVal = uploadInput.read();
            expect(nullVal).toBeNull();
        });

        it('can launchModal(), then returnModal()', function () {
            expect(typeof(uploadInput.launchModal)).toBe('function');
            expect(typeof(uploadInput.returnModal)).toBe('function');

            expect(function () {
                uploadInput.launchModal();
                uploadInput.returnModal();
            }).not.toThrow();
        });

        it('adds the class "lf-upload"', function () {
            var classes = uploadInput.class.split(' ');
            expect(classes).toContain('lf-upload');
        });

        it('has a elTag of "iframe"', function () {
            expect(uploadInput.elTag).toBe('iframe');
        });

        it('has a getTemplateContext()', function () {
            expect(typeof(uploadInput.template)).toBe('function');
            var cxt = uploadInput.getTemplateContext();
            expect(typeof(cxt)).toBe('object');
        });

        it('has a template()', function () {
            expect(typeof(uploadInput.template)).toBe('function');
            var cxt = uploadInput.getTemplateContext();
            expect(typeof(uploadInput.template(cxt))).toBe('string');
        });

        it('has a modalTemplate()', function () {
            expect(typeof(uploadInput.modalTemplate)).toBe('function');
            var cxt = uploadInput.getTemplateContext();
            expect(typeof(uploadInput.modalTemplate(cxt))).toBe('string');
        });

        it('reset()s and returns Array.<Content> when it _processResponse()s a successful response', function () {
            spyOn(uploadInput, 'reset');
            var retVal = uploadInput._processResponse(undefined, response);
            expect(uploadInput.reset).toHaveBeenCalled();
            expect(retVal).toBeTruthy();
            expect(typeof(retVal)).toBe('object');//Array, really
            expect(typeof(retVal.forEach)).toBe('function');
            expect(retVal.length).toBe(response.length);
        });

        it('logs for showError()', function () {
            if (debug.enabled('upload')) {
                spyOn(console, 'log').andCallThrough();

                uploadInput.showError('error');

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
                uploadInput.render();
            });

            xit('can getInput() from its view', function () {
                throw 'TODO (joao) Implement this!';
            });

            xit('can _validate(data) data', function () {
                throw 'TODO (joao) Implement this!';
            });

            it('can transform data into Content with _inputToContent(data)', function () {
                var retVal = uploadInput._inputToContent(response[0]);
                expect(retVal instanceof Content).toBe(true);
                expect(retVal.attachments.length).toBeTruthy();
            });

            xit('can showError(msg) in its view', function () {
                throw 'TODO (joao) Pending design input!';
            });

            xit('can be read() from', function () {
                throw 'TODO (joao) Implement this!';
            });

            describe('with an opts.destination', function () {
                beforeEach(function () {
                    uploadInput = new Upload({
                        destination: writable,
                        el: $('#sandbox')[0],
                    });

                    uploadInput.render();
                });

                // it('decorates .$postEl with a Button and stores it as ._postButton containing an AuthRequiredCommand wrapping an InputCommand command', function () {
                //     var btn = uploadInput._postButton;
                //     expect(btn).toBeTruthy();
                //     expect(btn._command instanceof AuthRequiredCommand).toBe(true);

                //     var authCmd = btn._command;
                //     expect(authCmd._command instanceof InputCommand).toBe(true);
                // });

                // it('sets an InputCommand with this as the source and ._destination as the destination', function () {
                //     var authCmd = uploadInput._postButton._command;
                //     var inputCmd = authCmd._command;
                //     expect(inputCmd._source).toBe(uploadInput);
                //     expect(inputCmd._destination).toBe(writable);
                // });
            });
        });

        describe('with additional opts', function() {
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
                //uploadInput.destroy();
            })

            it('assigns opts.destination to ._destination', function () {
                expect(uploadInput._destination).toBe(writable);
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
