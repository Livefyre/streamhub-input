'use strict';

var $ = require('jquery');
var Content = require('streamhub-sdk/content');
var inherits = require('inherits');
var LaunchableModal = require('streamhub-input/javascript/modal/launchable-modal');
var log = require('streamhub-sdk/debug')('streamhub-input/javascript/upload/view');
var Pipeable = require('streamhub-input/javascript/pipeable');
var View = require('streamhub-sdk/view');

/**
 * The reference to window.filepicker is stored here once loaded.
 * @private
 */
var picker = null;

/**
 * A view that handles the display of and data returned by FilePicker.
 * Parasitically inherits from Readable, allowing it to pipe returned data
 * to a Writable.
 * @param [opts] {Object}
 * @param [opts.filepicker] {{key: !string, cache: !string}} If you intend to use
 *      a different api key, you will also need to provide the cache url.
 * @param [opts.name] {string} Assigned to provider_name for returned data
 * @param [opts.destination] {Writable} The collection or other Writable that
 *      will receive this input. it is recommended that this is specified.
 * @constructor
 * @extends {View}
 */
function Upload(opts) {
  opts = $.extend(true, {}, Upload.DEFAULT_OPTS, opts);
  View.call(this, opts);
  LaunchableModal.call(this);
  Pipeable.call(this, opts);

  if (opts.filepicker) {
    this._filepickerKey = opts.filepicker.key;
    this._cacheUrl = opts.filepicker.cache;
    picker = opts.filepicker.instance || null;
  }
  this.name = opts.name || this.name;
}
inherits(Upload, View);
inherits.parasitically(Upload, LaunchableModal);
inherits.parasitically(Upload, Pipeable);

/**
 * provider_name attribute assigned to written data
 * @type {!string}
 */
Upload.prototype.name = 'Streamhub-Input/Upload';

/** @override */
Upload.prototype.elTag = 'iframe';

/** @override */
Upload.prototype.template = require('hgn!streamhub-input/templates/upload');

/**
 * Get contextual data for a template.
 * @override
 * @returns {!Object}
 */
Upload.prototype.getTemplateContext = function () {
  return {
    container: this.opts.pick.container
  };
};

/**
 * Loads the filepicker script if picker is undefined
 * @private
 */
Upload.prototype._initFilepicker = function () {
  if (picker) {
    return;
  }

  var protocol = window.location.protocol !== 'https:' ? 'http:' : 'https:';
  var src = protocol + this.opts.src;
  $.getScript(src, scriptLoadCallback);

  var self = this;
  function scriptLoadCallback(script, status) {
    if (status !== 'success') {
      picker = false;
      throw 'There was an error loading ' + src;
    }

    picker = window.filepicker;
    picker.setKey(self._filepickerKey);
    self.emit('pickerLoaded');
  }
};

/**
 * Key for FilePicker API.
 * @type {!string}
 * @private
 */
Upload.prototype._filepickerKey = 'AYNlO8P2PT6qnCfo9eCw2z';

/**
 * The URL where uploads are cached
 * @type {!string}
 * @private
 */
Upload.prototype._cacheUrl = 'http://media.fyre.co/';

/**
 * The default options for using FilePicker and pickAndStore
 * @type {!Object}
 */
Upload.DEFAULT_OPTS = {
  packageAs: 'content',
  pick: {
    'container': 'picker',
    'maxSize': 25*1024*1024, // allows files < 25MB
    'mimetypes': ['image/*'],
    'multiple': false
  },
  store: {
    'location': 'S3',
    'access': 'public'
  },
  convert: {
    'rotate': 'exif'
  },
  src: 'https://api.filepicker.io/v2/filepicker.js'
};

/**
 * Default callback to pickAndStore()
 * @param [err] {Object}
 * @param [inkBlob] {Object}
 */
Upload.prototype._processResponse = function (err, inkBlob) {
  if (err) {
    // 101 when dialog closed using x-box.
    if (err.code !== 101) {
      this.showError('There was an error storing the file.');
    }
    return;
  }

  var self = this;
  if (inkBlob) {
    if (!inkBlob.length) {
      inkBlob = [inkBlob];
    }

    $.each(inkBlob, function (index, blob) {
      self._postProcess(blob);
    });
  }
};

/**
 * @param {Object} blob
 * @private
 */
Upload.prototype._postProcess = function (blob) {
  var self = this;

  var converters = {
    image: function (blob, done) {
      picker.convert(blob, self.opts.convert, self.opts.store, function (convertedBlob) {
        var url = self._cacheUrl + convertedBlob.key;
        var attachment = {
          type: 'photo',
          url: url,
          link: url,
          provider_name: 'Livefyre'
        };

        var content = new Content({body: ''});
        content.attachments.push(attachment);
        done(content);
      });
    },

    video: function (blob, done) {
      var attachment = {
        type: 'video_promise',
        url: self._cacheUrl + blob.key,
        thumbnail_url: 'http://zor.livefyre.com/wjs/v3.0/images/video-play.png',
        thumbnail_width: 75,
        thumbnail_height: 56,
        provider_name: 'Livefyre'
      };

      var content = new Content({body: ''});
      content.attachments.push(attachment);
      done(content);
    }
  };

  var contentType = blob.mimetype.split('/')[0];

  if (contentType in converters) {
    return converters[contentType](blob, $.proxy(this.writeToDestination, this));
  }
  throw 'Unknown content type: ' + contentType;
};

/**
 * Displays and operates this view as a modal.
 * @param [callback] {function(err: Object, data: Object)}
 *      Called after a successful interaction
 * @override
 */
Upload.prototype.launchModal = function (callback) {
  var self = this;
  if (!picker) {
    this.once('pickerLoaded', this.launchModal.bind(this, callback));
    return this._initFilepicker();
  }

  LaunchableModal.prototype.launchModal.apply(this, arguments);

  function errBack(err, data) {
    self._processResponse(err, data);

    self.opts.disableSuccessModal ?
      self.returnModal() :
      self.showSuccess(self.opts, $.proxy(self.returnModal, self));
  }
  function successFn(inkBlob) {
    errBack(null, inkBlob);
  }
  function errorFn(err) {
    errBack(err);
  }

  picker.pickAndStore(this.opts.pick, this.opts.store, successFn, errorFn);
};

/** @override */
Upload.prototype.showError = function (msg) {
  // TODO (joao) Real implementation
  log(msg);
};

module.exports = Upload;
