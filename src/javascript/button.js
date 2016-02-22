'use strict';

var AuthRequiredCommand = require('streamhub-sdk/ui/auth-required-command');
var Button = require('streamhub-sdk/ui/button');
var inherits = require('inherits');
var packageAttribute = require('streamhub-input/javascript/package-attribute');
var ThemeStyler = require('livefyre-theme-styler');
var themableCss = require('text!streamhub-input/styles/theme.css');
var uuid = require('node-uuid');

/**
 * @param command {Command} Command to execute.
 * @param [opts] {Object}
 * @param [opts.input] {Pipeable} The Input source.
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @param [opts.authRequired] {boolean} True by default. Wraps the command in an
 *      auth-required-command, disabling the button unless there is an
 *      authentication route.
 * @constructor
 * @extends {Button}
 */
function InputButton(command, opts) {
  opts = opts || {};

  /**
   * @type {?Pipeable}
   */
  this._input = opts.input || null;

  /**
   * Create a UUID for this instance. Used specifically for multiple instances
   * so that there aren't conflicts.
   * @type {string}
   * @private
   */
  this._uuid = uuid();

  /**
   * The style prefix to provide to the theme styler.
   * NOTE: The second option does not include a space intentionally so that
   *       the code that removes the :host selector in the theme styler will
   *       remove it and will keep this prefix as the top-level selector.
   *       e.g. [attr=value] :host.lf-input-button {} becomes
   *            [attr=value].lf-input-button {}
   * @type {string}
   */
  this._stylePrefix = opts.stylePrefix ||
        ['[', this.prefixAttribute, '="', this._uuid, '"]'].join('');

  if (opts.destination) {
    this.pipe(opts.destination);
  }

  if (opts.authRequired !== false) {
    command = new AuthRequiredCommand(command);
  }

  Button.call(this, command, opts);

  this._applyTheme(opts.styles);
}
inherits(InputButton, Button);

/** @override */
InputButton.prototype.elClass += ' input-btn';

/** @override */
InputButton.prototype.elTag = 'button';

/**
 * Prefix attribute that will be added to the the bound element.
 * @type {string}
 */
InputButton.prototype.prefixAttribute = 'lf-input-uuid';

/**
 * Apply the theme to the app instance. Creates a theme styler instance and
 * adds a style element to the head element with the styles provided in the
 * theme object.
 * @param {Object} theme The theme to apply.
 * @private
 */
InputButton.prototype._applyTheme = function (theme) {
  this._themeStyler = this._themeStyler || new ThemeStyler({
    css: themableCss,
    prefix: this._stylePrefix
  });
  this._themeStyler.applyTheme(theme);
};

/** @override */
InputButton.prototype.setElement = function (el) {
  if (this.$el) {
    this.$el.unwrap();
  }
  Button.prototype.setElement.call(this, el);
  packageAttribute.wrapWithStylePrefix(this.$el);
  this.$el.attr(this.prefixAttribute, this._uuid);
};

/**
 * Facade for button's input.
 * @param {Writable} writable
 */
InputButton.prototype.pipe = function (writeable) {
  if (this._input) {
    this._input.pipe(writeable);
  }
};

/**
 * Facade for button's input.
 * @param {Writable} writable
 */
InputButton.prototype.unpipe = function (writeable) {
  if (this._input) {
    this._input.unpipe(writeable);
  }
};

module.exports = InputButton;
