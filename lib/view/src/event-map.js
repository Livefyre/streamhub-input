'use strict';

/**
 * An extensible object that maps event selectors to callback functions
 * @param events {Object} - Initial event mapping
 */
function EventMap (events) {
    this._factories = [];
    extend(this, [events]);
}

/**
 * Return another EventMap that has been extended with
 * the provided objects
 * @param {...object} extensions - Objects to extend from
 * @returns {EventMap} - A new EventMap, extended from this and others
 */
EventMap.prototype.extended = function () {
    var newMap = new EventMap(this);
    var extensions = [].slice.apply(arguments);
    extend(newMap, extensions);
    return newMap;
};

/**
 * Evaluate the EventMap with a particular context
 * Any ._factories will be called so that `this` is the provided context
 * @returns {object} object mapping event strings/selectors to callback functions
 */
EventMap.prototype.withContext = function (context) {
    var contextualExtensions = [];
    var factory;
    var theseEvents;
    var events = {};
    for (var i=0, numFactories=this._factories.length; i < numFactories; i++) {
        factory = this._factories[i];
        theseEvents = {};
        contextualExtensions.push(factory.call(context, theseEvents) || theseEvents);
    }
    extend(events, [this].concat(contextualExtensions));
    return events;
};

/**
 * Extend the first argument with keys from the rest, left to right
 * Only extends ownProperties (unlike $.extend)
 * @param {object} target - Target Object to extend
 * @param {object[]} extensions - Array of Objects to extend from
 */
function extend (target, extensions) {
    var copy, name, extension, extensionsLength;
    target = target || {},
    extensions = extensions || [];
    extensionsLength = extensions.length;

    for (var i=0; i < extensionsLength; i++) {
        // Only deal with non-undefined values
        if ((extension = extensions[i]) !== undefined) {
            // If it's a function, store in target._factories
            if (typeof extension === 'function') {
                target._factories.push(extension);
                continue;
            }
            // Extend the base object
            for (name in extension) {
                if ( ! extension.hasOwnProperty(name)) {
                    continue;
                }
                copy = extension[name];

                // Copy _factories array
                if (name === '_factories' && copy.slice) {
                    copy = copy.slice();
                }

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
}

module.exports = EventMap;
