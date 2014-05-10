Streamhub-Input
===============
[Streamhub-Input](//github.com/Joao-S-Martins/streamhub-input "Streamhub-Input repository") serves as a repository of views and other interactable items that gather some information (input) from a user and propogate that information into another view or into a collection. It's an extension to the [Livefyre Streamhub-SDK](//github.com/Livefyre/streamhub-sdk "Streamhub-SDK repository") and is best used in conjunction with Livefyre's offerings. A [demo and testing harness](//joao-s-martins.github.io/streamhub-input/built.html "Input demo and testing harness") is available as well as several [example pages](//github.com/Joao-S-Martins/streamhub-input/tree/master/examples "Examples Input implementations") to help with implementations. To use it on your site, you'll need to include the [distribution packages](//github.com/Joao-S-Martins/streamhub-input/tree/master/dist "Distribution files") on your page and load the needed modules using `HubInput.require('module-name')`.

-------------
##Input Views
Current views include [Comment](https://github.com/Joao-S-Martins/streamhub-input/tree/master/src/comment "Comment source code") for simple text input and [Uploader](https://github.com/Joao-S-Martins/streamhub-input/tree/master/src/upload "Upload source code") for image contributions. All views implement the [Input abstract](https://github.com/Joao-S-Martins/streamhub-input/blob/master/src/main.js "Input abstract source code"), designed to provide a uniform set of APIs for grabbing a user's input and performing common tasks such as validation and error handling. As with any view, these Input views are designed to be passed an element and rendered on that element. Alternatively though, these views also implement the new [Launchable Modal abstract](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/modal/launchable-modal.js "Launchable Modal source code"). This defines a couple of methods that allow the view to render in a modal and close the modal when it has finished recieving input from a user.

###Comment Editor
This Input view is commonly refered to in the code as [Comment](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/comment/main.js "Comment source code"). It's a simple view for recieving text input.

####Constructor Options
```JavaScript
var opts = {
    destination: Writable,//The Collection/Writable to send input to when the submission button is clicked
    i18n: {//An optional object of displayed strings
        emptyText: 'Comment here...'//Placeholder in the input space before the user adds their own input
    }
};
```

####Basic Implementation
As a Modal
```JavaScript
var modCom = new Comment();
modCom.launchModal(callback);//The callback is optional, but useful
```
Embedded on the page
```JavaScript
var embCom = new Comment({
    el: document.getElementById("comment")
});
embCom.render();
```

####Public API
The public API for Comment is simply what is required by the [Input](https://github.com/Joao-S-Martins/streamhub-input/blob/master/src/main.js "Input abstract source code") and [Launchable Modal](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/modal/launchable-modal.js "Launchable Modal source code") abstracts that it implements. Nothing further has been added.

###Image Uploader
This Input view is commonly refered to in the code a [Upload](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/upload/main.js "Upload source code"). It utilizes [Filepicker.io](//www.inkfilepicker.com/ "Filepicker.io, by Ink") to accept images from a user. Currently, only the modal version of this view is supported.

####Constructor Options
```JavaScript
var opts = {
    filepicker: {//If you'd like to use your own filepicker account...
        key: 'keystring',//...then provide the key...
        cache: 'urlstring'//...and the image cache URL
    },
    name: 'uploader'//The optional source name that is used when defining attachments to LivefyreContent
};
```

####Basic Implementation
As a Modal
```JavaScript
var modUp = new Upload();
modUp.launchModal(callback);//The callback is optional, but useful
```
~~Embedded on the page~~ **Not yet supported**
```JavaScript
var embUp = new Upload({
    el: document.getElementById("upload")
});
embUp.render();
```

####Public API
The public API for Upload is simply what is required by the [Input](https://github.com/Joao-S-Martins/streamhub-input/blob/master/src/main.js "Input abstract source code") and [Launchable Modal](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/modal/launchable-modal.js "Launchable Modal source code") abstracts that it implements. Nothing further has been added.

---------------
##Input Buttons
With the new Input views, there are also new Input buttons that launch these views as modals. They are very simple to implement as they handle the required commands and view instances on construction for you.

###Show me the code
There is a  [base Input Button definition](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/button.js "Input Button source code") that is meant to be extended with view-specific commands. This has already been done to create the [comment button](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/comment/button.js "Comment Button source code") and the [upload button](//github.com/Joao-S-Martins/streamhub-input/blob/master/src/upload/button.js "Comment Button source code"). Below, we'll focus on how to construct and use these two extensions of the actuall Input Button.

####Constructor Options
```JavaScript
var opts = {
    el: document.getElementById("btn"),//The button element to decorate
    destination: Writable//An optional writable to pipe to
    command: Command//Not recommended.
            //Exists incase you need to override the default command behavior
};
```

####Basic Implementation
Assuming `Colection instanceof streamhub-sdk/collection` and
`ContentListVew instanceof streamhub-sdk/content/views/content-list-view`
```JavaScript
var commentBtn = new CommentButton({el: document.getElementById("btn")});

Collection.pipe(ContentListView);
commentBtn.pipe(Collection);
```
The process here is that `Collection` will push content to `ContentListView` and `commentBtn` will push content to `Collection`. The content pushed into `Collection` is written to its original source on the servers.

And just for fun, remember that `ContentListView` is a `Writable` and the Input buttons work with any `Writable`. So instead of piping `commentBtn` to `Collection`, you can pipe it to `ContentListView` and have a stateless system that is great for testing layouts and design elements without having to record a bunch of test comments on actual servers.

####Public API
The API for an Input Button is the same as for any other Passthrough. Nothing was added.
