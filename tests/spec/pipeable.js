'use strict';

var Pipeable = require('streamhub-input/javascript/pipeable');
var Writable = require('stream/writable');

describe('streamhub-input/javascript/pipeable', function () {
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

    expect(function () {
      pipeable.writeToDestination('chunk', 'cb');
    }).toThrow();
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
