var Pipeable = require('streamhub-input/pipeable');
var Writable = require('stream/writable');

'use strict';

describe('streamhub-input/pipeable', function () {
    it('can pipe, unpipe, and writeToDestination', function () {
        var writable = new Writable();
        var pipeable = new Pipeable();
        pipeable.pipe(writable);
        expect(pipeable._destination).toEqual(writable);

        spyOn(writable, 'write');
        pipeable.writeToDestination('chunk', 'cb');
        expect(writable.write.callCount).toEqual(1);
        expect(writable.write).toHaveBeenCalledWith('chunk', 'cb');

        pipeable.unpipe();
        expect(pipeable._destination).toEqual(null);

        pipeable.writeToDestination('chunk', 'cb');
        expect(writable.write.callCount).toEqual(1);  // Not called again
    });

    it('can be constructed with a destination', function () {
        var writable = new Writable();
        var pipeable = new Pipeable({
            destination: writable
        });
        expect(pipeable._destination).toEqual(writable);
    });
});
