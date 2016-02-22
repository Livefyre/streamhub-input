/**
 * Prefix every rule in the in css string
 * with an attribute selector that targets only
 * elements in Components created from THIS version
 * of the module
 */
module.exports = function (packageJson, rework, css) {
  var prefix = attrSelector('data-lf-package', packageName(packageJson));

  console.log('prefixing css');
  var prefixedCss = rework(css)
        .use(rework.prefixSelectors(prefix))
        .toString();
  return prefixedCss;
};

function attrSelector(attr, value) {
  var selector = '[{attr}~="{value}"]'
        .replace('{attr}', attr)
        .replace('{value}', value);
  return selector;
}

function packageName(packageJson) {
  return packageJson.name + '#' + packageJson.version;
}
