define(['jasmine', 'stream/duplex', 'stream/passthrough'],
function (jasmine, Duplex, PassThrough) {
    describe('stream/passthrough', function () {
        it('is a function', function () {
            expect(PassThrough).toEqual(jasmine.any(Function));
        });

        describe('when constructed', function () {
            var stream;
            beforeEach(function () {
                stream = new PassThrough();
            });
            it('is instanceof Duplex', function () {
                expect(stream instanceof Duplex).toBe(true);
            });
            it('is .readable and .writable', function () {
                expect(stream.writable).toBe(true);
                expect(stream.readable).toBe(true);
            });
            it('defaults .allowHalfOpen to true', function () {
                expect(stream.allowHalfOpen).toBe(true);
            });
            it('can write and read the same data', function () {
                var data = 'gobengo';
                stream.write(data);
                expect(stream.read()).toBe(data);
            });
        });

        it('is not .readable if passed opts.readable: false', function () {
            var stream = new PassThrough({
                readable: false
            });
            expect(stream.readable).toBe(false);
        });

        it('is not .writable if passed opts.writable: false', function () {
            var stream = new PassThrough({
                writable: false
            });
            expect(stream.writable).toBe(false);
        });

        describe('when constructed with opts.allowHalfOpen: false', function () {
            var stream;
            beforeEach(function () {
                stream = new PassThrough({
                    allowHalfOpen: false
                });
            });
            it('has .allowHalfOpen === false', function () {
                expect(stream.allowHalfOpen).toBe(false);
            });
        });
    });
});