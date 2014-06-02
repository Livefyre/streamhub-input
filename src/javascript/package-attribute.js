var packageJson = require('json!streamhub-input/../package.json');
var packageAttribute = 'data-lf-package';

/**
 * Decorate an HTMLElement with the proper package attribute
 * for streamhub-wall e.g.
 * data-lf-package="streamhub-wall#3.0.0"
 */
exports.decorate = function (el) {
    var currentVal = el.getAttribute(packageAttribute);
    var newVal = packageName(packageJson);
    // If there already was this attribute, just add to the attr
    // space-separated
    if (currentVal && currentVal.indexOf(newVal) === -1) {
        newVal = [currentVal, ' ', newVal].join('');
    }
    el.setAttribute(packageAttribute, newVal);
};

exports.undecorate = function (el) {
    var currentVal = el.getAttribute(packageAttribute) || '';
    var newVal = currentVal.replace(packageName(packageJson), '');
    el.setAttribute(packageAttribute, newVal);
};

exports.decorateModal = function modalWithPackageSelector(modal) {
    modal.$el.on('showing', setHasPackageAttribute.bind({}, modal, true));
    modal.$el.on('hiding', setHasPackageAttribute.bind({}, modal, false));
    return modal;
};

function setHasPackageAttribute(modal, shouldHaveAttr) {
    exports[shouldHaveAttr ? 'decorate' : 'undecorate'](modal.parentNode);
}

function packageName(packageJson) {
    return packageJson.name + '#' + packageJson.version;
}
