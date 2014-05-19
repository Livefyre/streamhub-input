'use strict';

var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var util = require('streamhub-sdk/util');
var View = require('view');

describe('streamhub-input/javascript/modal/launchable-modal', function () {
    describe('inherits.parasitically() by a View and', function () {
        var clbk;
        var data;
        var err;
        var SubView;
        var view;
        beforeEach(function () {
            SubView = function (opts) {
                if (!opts || !opts.noTemplate) {
                    this.template = function () {
                        return '<div></div>';
                    };
                }

                View.apply(this, arguments);
                LaunchableModal.apply(this, arguments);
            };
            inherits(SubView, View);
            inherits.parasitically(SubView, LaunchableModal);

            clbk = jasmine.createSpy('callback');
            data = 'stuff';
            err = 'error';
            view = new SubView();
        });

        it('preserves template() to be used for default rendering', function () {
            expect(typeof(view.template)).toBe('function');
            expect(typeof(view.template({}))).toBe('string');
        });

        it('can launchModal without a callback', function () {
            expect(function () {
                view.launchModal();
            }).not.toThrow();
            expect(view._modal).toBeTruthy();
            expect(view._modal._modalSubView).toBe(view);
        });

        it('can launchModal with a callback, then calls it and passes err and/or data during returnModal()', function () {
            view.launchModal(clbk);
            view.returnModal(err, data);
            expect(clbk).toHaveBeenCalledWith(err, data);
        });

        it('does nothing when returnModal() is called out of turn', function () {
            //Do it right
            view.launchModal(clbk)
            view.returnModal();
            expect(clbk.calls.length).toBe(1);

            //Do it wrong
            view.returnModal();
            expect(clbk.calls.length).toBe(1);
        });

        it('hide()s the modal when returnModal', function () {
            view.launchModal(clbk)
            expect(view._modal).toBeTruthy();

            spyOn(view._modal, 'hide').andCallThrough();
            view.returnModal();
            expect(view._modal.hide).toHaveBeenCalled();
        });

        it('can launchModal() and returnModal(), then do it again, even with another callback', function () {
            var clbk2 = jasmine.createSpy('other callback');
            view.launchModal(clbk)
            view.returnModal();
            view.launchModal(clbk2)
            view.returnModal();
            expect(clbk.calls.length).toBe(1);
            expect(clbk2.calls.length).toBe(1);
        });
    });
});
