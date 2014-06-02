Streamhub-Input
===============

A simple comment editor and image filepicker for use with the [Livefyre Streamhub-SDK](//github.com/Livefyre/streamhub-sdk "Streamhub-SDK repository") and apps such as the [Livefyre Media Wall](//github.com/Livefyre/streamhub-wall)

## Getting Started

Load the JavaScript and CSS using the Livefyre loader:

```
<script src="http://cdn.livefyre.com/Livefyre.js"></script>
<script type="text/javascript">
    Livefyre.require(['streamhub-input#v0.3'], function (Input) {
        var editorButton = new Input.ContentEditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true
        });
        editorButton.render();
    });
</script>
```

## Available UI Components

The Input module exposes the following Views:

- ContentEditor
- ContentEditorButton
- UploadButton

## Posting Content

The components sure look pretty, but they aren't very useful until the user created Content is piped to a destination. Let's see how that works! (For more example code, one can also peruse the `examples/` directory in the project.)

```
var coll = new Collection(collOpts);
var uploadButton = new UploadButton({
    el: document.getElementById('upload-button')
});
uploadButton.render();

// The pipe method expects a Collection or another Writeable (such as a ContentListView.)
uploadButton.pipe(coll);
```

The pipe method is implemented by all of the top level Views exposed by the Input module.

## Local Development

`npm install` install node modules and bower packages.

`npm test` run the tests in Phantom.

`npm start` run the dev server, you will need to do this before playing with the example pages.
