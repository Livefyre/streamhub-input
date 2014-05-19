'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var debug = require('streamhub-sdk/debug');
var inherits = require('inherits');
var jasmineJquery = require('jasmine-jquery');//For sandbox()
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var ModalInputCommand= require('streamhub-input/javascript/modal/modal-input-command');
var Upload = require('streamhub-input/javascript/upload/view');
var util = require('streamhub-sdk/util');
var View = require('view');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/upload/view', function () {
    it('is an constructor that subclasses View and implements Input and LaunchableModal', function () {
        expect(typeof(Upload)).toBe('function');
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
            writable._write = function () {};
            uploadInput.pipe(writable);
        });

        afterEach(function () {
            uploadInput.destroy();
        })

        it('can launchModal(), then returnModal()', function () {
            expect(typeof(uploadInput.launchModal)).toBe('function');
            expect(typeof(uploadInput.returnModal)).toBe('function');

            expect(function () {
                uploadInput.launchModal();
                uploadInput.returnModal();
            }).not.toThrow();
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

        it('Returns Array.<Content> when it _processResponse()s a successful response', function () {
            var retVal = uploadInput._processResponse(undefined, response);
            expect(retVal).toBeTruthy();
            expect(typeof(retVal)).toBe('object');//Array, really
            expect(typeof(retVal.forEach)).toBe('function');
            expect(retVal.length).toBe(response.length);
        });

        describe('and rendered', function () {
            var testString = "Test comment"
            beforeEach(function () {
                uploadInput.render();
            });

            it('can transform data into Content with _packageInput(data)', function () {
                var retVal = uploadInput._packageInput(response[0]);
                expect(retVal instanceof Content).toBe(true);
                expect(retVal.attachments.length).toBeTruthy();
            });

            xit('can showError(msg) in its view', function () {
                throw 'TODO (joao) Pending design input!';
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
