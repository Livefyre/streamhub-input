'use strict';

var $ = require('jquery');
var Auth = require('streamhub-sdk/auth');
var CommentButton = require('streamhub-input/javascript/content-editor/button');
var InputButton = require('streamhub-input/javascript/button');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/content-editor/button', function () {
    it('is a constructor that extends InputButton', function () {
        expect(typeof(CommentButton)).toBe('function');

        var cmtBtn = new CommentButton();
        expect(cmtBtn instanceof InputButton).toBe(true);
    });

    describe('when constructed', function () {
        var cmtBtn;
        var writable;
        var testString = 'data sample';
        beforeEach(function () {
            cmtBtn = new CommentButton();
            writable = new Writable();
            writable._write = function () {};
            spyOn(writable, '_write').andCallFake(function (data, clbk) {
                clbk();
            });
        });

        it('can pipe data to a writable', function () {
            cmtBtn.pipe(writable);
            cmtBtn._input.writeToDestination(testString);
            expect(writable._write).toHaveBeenCalled();
        });

        describe('with opts.destination', function () {
            beforeEach(function () {
                cmtBtn = new CommentButton({destination: writable});
            });

            it('.pipe()s to destination', function () {
                cmtBtn._input.writeToDestination('something');
                expect(writable._write).toHaveBeenCalled();
            });

            describe('and render()\'d', function () {
                beforeEach(function () {
                    cmtBtn.render();
                });

                xit('can be clicked to launch an Edit modal, then receive and pipe the returned value', function () {
                    Auth.setToken('FAKE');//Fake auth
                    //cmtBtn.pipe(writable);
                    cmtBtn.$el.click();

                    var $editor = $('.editor-container > .editor-field');
                    var $post = $('.editor-post-btn');
                    expect($editor).toBeTruthy();
                    expect($post).toBeTruthy();

                    $editor.val(testString);
                    $post.click();
                    expect(writable._write).toHaveBeenCalled();
                });
            });
        });

        describe('with opts.mediaEnabled', function () {
            beforeEach(function () {
                cmtBtn = new CommentButton({mediaEnabled: true });
            });

            it('should enable media on its ContentEditor input', function () {
                expect(cmtBtn._input.opts.mediaEnabled).toBeTruthy();
            });
        });
    });
});
