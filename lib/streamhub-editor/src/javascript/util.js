/**
 * @fileoverview Util functions that are useful the other modules.
 */

var util = {};

/**
 * Abstract function. This is wicked awesome for ensuring that all of the
 * functions get overridden when using the inheritance pattern.
 */
util.abstractMethod = function() {
    throw 'Function must be implemented.';
};

module.exports = util;
