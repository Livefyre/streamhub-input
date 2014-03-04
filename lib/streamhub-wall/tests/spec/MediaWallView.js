define([
    'jasmine',
    'streamhub-wall',
    'streamhub-sdk',
    'streamhub-sdk/content',
    'streamhub-sdk-tests/mocks/mock-attachments-stream',
    'jasmine-jquery'],
function (jasmine, MediaWallView, Hub, Content, MockStream) {
    'use strict';

    describe('A MediaWallView', function () {
        // construction behavior
        describe('can be constructed', function() {
            it ("with no options", function () {
                var view = new MediaWallView();
                expect(view).toBeDefined();
            });
            it ("with empty options", function () {
                var view = new MediaWallView({});
                expect(view).toBeDefined();
            });
            it ("with an el", function () {
                setFixtures('<div id="hub-MediaWallView"></div>');
                var view = new MediaWallView({
                    el: $('#hub-MediaWallView')
                });
                expect(view).toBeDefined();
            });
        });
        
        // post construction behavior    
        describe ("after correct construction", function () {
            var view;
            var stream;
            
            beforeEach(function() {
                setFixtures('<div id="hub-MediaWallView"></div>');
                stream = new MockStream();
                view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            });
            it ("should contain 9 mock items & childViews (from MockAttatchmentsStream) after stream start", function () {
                var onEnd = jasmine.createSpy('onEnd');
                stream.pipe(view);
                stream.on('end', onEnd);
                waitsFor(function () {
                    return onEnd.callCount;
                });
                runs(function () {
                    expect(view.views.length).toBe(9);
                });
            });
        });

        describe("when adding content with different .createdAt dates", function () {
            var view,
                startDateInt = 1375383041586,
                date1 = new Date(startDateInt),
                date2 = new Date(startDateInt + 1 * 10000),
                date3 = new Date(startDateInt + 2 * 10000),
                content1, content2, content3;
            beforeEach(function () {
	            setFixtures('<div id="hub-MediaWallView"></div>');
                $('#hub-MediaWallView').width(300*4); //220px is the default width of content
	            view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
                content1 = new Content({ body: 'what1' });
                content1.createdAt = date1;
                content2 = new Content({ body: 'what2' });
                content2.createdAt = date2;
                content3 = new Content({ body: 'what3' });
                content3.createdAt = date3;
                view.add(content3);
                view.add(content1);
                view.add(content2);
            });
            it("should select target column ContentView to write into", function () {
                expect(view._columnViews.length).toEqual(4);
                expect(view._columnViews[0].views[0].content).toEqual(content3);
                expect(view._columnViews[1].views[0].content).toEqual(content1);
                expect(view._columnViews[2].views[0].content).toEqual(content2);
            });
        });

        describe("when removing content", function () {
            var view, content1, content2, content3;
            beforeEach(function () {
	            setFixtures('<div id="hub-MediaWallView"></div>');
                $('#hub-MediaWallView').width(300*4); //220px is the default width of content
	            view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
                content1 = new Content({ body: 'what1' });
                content2 = new Content({ body: 'what2' });
                content3 = new Content({ body: 'what3' });
                view.add(content3); //column1
                view.add(content1); //column2
                view.add(content2); //column3
            });

            it('should remove the contentView from #views', function () {
                expect(view.views.length).toEqual(3);
                view.remove(content1)
                expect(view.views.length).toEqual(2);
            });

            it('should remove the contentView from the appropriate column view', function () {
                expect(view._columnViews[0].views.length).toEqual(1);
                expect(view._columnViews[0].views[0].content.body).toEqual('what3');
                view.remove(content3);
                expect(view._columnViews[0].views.length).toEqual(0);
            });
        });
    });

    describe("auto fitting columns", function () {
        var view;

	    beforeEach(function() {
	        setFixtures('<div id="hub-MediaWallView"></div>');
		});

        it('calls #fitColumns() in constructor if no opts.columns specified', function () {
            spyOn(MediaWallView.prototype, 'fitColumns');

            $('#hub-MediaWallView').width(220*4); //220px is the default width of content
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            expect(view._autoFitColumns).toBe(true);
            expect(MediaWallView.prototype.fitColumns).toHaveBeenCalled();
        });

        it('calls #fitColumns() when window is resized', function () {
            $('#hub-MediaWallView').width(220*4); //220px is the default width of content
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0) });
            spyOn(view, 'fitColumns');
            $(window).trigger('resize');
            expect(view._autoFitColumns).toBe(true);
            expect(view.fitColumns).toHaveBeenCalled();
        });

        it('sets column width proportional to the media wall width', function () {
            $('#hub-MediaWallView').width(12345);
	        view = new MediaWallView({ el: $('#hub-MediaWallView').get(0), minContentWidth: 400 });
            expect(view._columnViews.length).toBe(parseInt(12345/400));
        });
    });
});
