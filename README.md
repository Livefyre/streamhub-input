Streamhub-Input
===============

A simple comment editor and image filepicker for use with the [Livefyre Streamhub-SDK](//github.com/Livefyre/streamhub-sdk "Streamhub-SDK repository") and apps such as the [Livefyre Media Wall](//github.com/Livefyre/streamhub-wall)

##Getting Started

Load the javascript using the Livefyre loader:

```
<script src="http://cdn.livefyre.com/Livefyre.js"></script>
<script type="text/javascript">
    Livefyre.require('streamhub-input#v0.2', function (Input) {
        var editorButton = new Input.ContentEditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true
        });
        editorButton.render();
    });
</script>
```

##Available UI Components

The Input module exposes the following Views:

- ContentEditor
- ContentEditorButton
- UploadButton
