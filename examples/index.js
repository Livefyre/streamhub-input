require([
    'livefyre-auth',
    'auth/contrib/auth-button',
    'streamhub-sdk/debug',
    'streamhub-sdk/jquery',
    'streamhub-sdk/content/views/content-list-view',
    'streamhub-sdk/collection',
    'streamhub-input',
],function (livefyreAuth, createAuthButton, debug, $, ContentListView, Collection, Input) {
    livefyreAuth.delegate(livefyreAuth.createDelegate('http://www.qa-ext.livefyre.com'));

    $(function () {
        var opts = {
            "network": "livefyre.com",
            "siteId": "290596",
            "articleId": "136",
            "environment": "qa-ext.livefyre.com"
        };

        var listView = window.listView = new ContentListView({
            el: document.getElementById("listView"),
        });

        var collection = window.collection = new Collection(opts);
        collection.pipe(listView);

        createAuthButton(livefyreAuth, document.getElementById('auth-button'));
        var uploadButton = window.uploadButton = new Input.UploadButton({
            el: document.getElementById('upload-button'),
            mimetypes: ['image/*', 'video/mp4']
        });
        var editorButton = window.editorButton = new Input.ContentEditorButton({
            el: document.getElementById('editor-button'),
            mediaEnabled: true,
            maxAttachmentsPerPost: 1,
            mimetypes: ['image/*', 'video/mp4']
        });
        var contentEditor = window.editorButton = new Input.ContentEditor({
            el: document.getElementById('content-editor'),
            mediaEnabled: true,
            maxAttachmentsPerPost: 1,
            mimetypes: ['image/*', 'video/mp4'],
            showTitle: true
        });

        uploadButton.render();
        editorButton.render();
        contentEditor.render();
        uploadButton.pipe(collection);
        editorButton.pipe(collection);
        contentEditor.pipe(collection);
    });
});
