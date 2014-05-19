'use strict';

var Auth = require('auth');
var Button = require('streamhub-sdk/ui/button');
var Command = require('streamhub-sdk/ui/command');
var Content = require('streamhub-sdk/content');
var InputButton = require('streamhub-input/javascript/button');
var Passthrough = require('stream/passthrough');
var Readable = require('stream/readable');
var Upload = require('streamhub-input/javascript/upload/view');
var UploadButton = require('streamhub-input/javascript/upload/button');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/upload/button', function () {
    it('is a constructor that extends InputButton', function () {
        expect(typeof(UploadButton)).toBe('function');

        var upldBtn = new UploadButton();
        expect(upldBtn instanceof InputButton).toBe(true);
    });

    describe('when constructed', function () {
        var opts;
        var upldBtn;
        var writable;
        var testString = 'data sample'
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

                    upldBtn.render();
                });

                it('can be clicked to launch an Upload modal, then receive and pipe the returned value', function () {
                    upldBtn.$el.click();
                    var picker = $('#picker');
                    expect(picker).toBeTruthy();
                });

                it('can receive and pipe the value returned by Upload', function () {
                    upldBtn = new UploadButton(opts);
                    upldBtn.pipe(writable);
                    spyOn(upldBtn._input, '_processResponse').andCallThrough();
                    upldBtn.render();
                    upldBtn._command.execute(function (err, data) {});

                    waitsFor(function() {
                        return window.filepicker &&
                            upldBtn._input._processResponse.calls.length;
                    }, 'filepicker to load', 2000);
                    runs(function () {
                        expect(writable._write).toHaveBeenCalled();
                    });
                });
            });
        });
    });
});
