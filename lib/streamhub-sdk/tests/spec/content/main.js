define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/content'],
function ($, Content) {
    'use strict';

    describe('Content', function () {
        it("can be constructed with just a string", function () {
            var body = 'what';
            var content = new Content(body);
            expect(content.body).toBe(body);
        });

        it("can be constructed with opts and opts.body and opts.id", function () {
            var body = 'what';
            var content = new Content({
                body: body,
                id: '123456'
            });
            expect(content.body).toBe(body);
        });

        describe(".set", function () {
            var oldBody,
                newBody,
                content,
                onChange;
            beforeEach(function () {
                oldBody = "Body text";
                newBody = "New body text";
                content = new Content(oldBody);
                onChange = jasmine.createSpy('change listener');
            });

            it("only emits 'change' when something is changed", function () {
                content.on('change', onChange);

                content.set({body: newBody});//Change
                content.set({body: newBody});//Not changed

                expect(onChange).toHaveBeenCalledWith({body: newBody}, {body: oldBody});
                expect(onChange).not.toHaveBeenCalledWith({body: newBody}, {body: newBody});
            });

            it("emits 'change' when objects change", function() {
                content.on('change', onChange);
                var obj = {};
                content.body = obj;
                content.set({body: obj});//Change

                expect(onChange).toHaveBeenCalled();
            });

            it("emits 'change:setting' for each setting change", function () {
                content.on('change:body', onChange);
                content.on('change:visibility', onChange);

                content.set({body: newBody, visibility: 'OWNER'});

                expect(onChange).toHaveBeenCalledWith(newBody, oldBody);
                expect(onChange).toHaveBeenCalledWith('OWNER', 'EVERYONE');
            });
        });
    });
});
