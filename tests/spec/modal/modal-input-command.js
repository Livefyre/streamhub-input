'use strict';

var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var ModalInputCommand= require('streamhub-input/javascript/modal/modal-input-command');
var ModalView = require('streamhub-sdk/modal');
var View = require('view');

describe('streamhub-input/javascript/modal/modal-input-command', function () {

    it('is an constructor that subclasses Command', function () {
        expect(typeof(ModalInputCommand)).toBe('function');
    });

    it('thows if you try to construct without specifying a view', function () {
        expect(function () {
            new ModalInputCommand();
        }).toThrow();
    });

    describe('when constructed', function () {
        var LaunchableView = function (opts) {
            if (!opts || !opts.noTemplate) {
                this.template = function () {
                    return '<div></div>';
                };
            }

            View.apply(this, arguments);
            LaunchableModal.apply(this, arguments);
        };
        inherits(LaunchableView, View);
        inherits.parasitically(LaunchableView, LaunchableModal);

        var clbk;
        var inputCmd;
        var view;
        beforeEach(function () {
            clbk = jasmine.createSpy('callback');
            view = new LaunchableView();
            inputCmd = new ModalInputCommand(view);
        });

        it('!.canExecute() if the view is taken away', function () {
            inputCmd.view = undefined;
            expect(inputCmd.canExecute()).toBeFalsy();
        });

        describe('with opts', function() {
            var fn;
            var opts;
            var modal = new ModalView();
            beforeEach(function () {
                fn = jasmine.createSpy('custom function');
                opts = {
                    modal: modal,
                    fn: fn
                };

                inputCmd = new ModalInputCommand(view, opts);
            });

            it('laucnhes the LaunchableModal with the modal', function () {
                inputCmd.execute();
                expect(inputCmd.view._modal).toEqual(modal);
                inputCmd.view.returnModal();
            });
        });
    });
});
