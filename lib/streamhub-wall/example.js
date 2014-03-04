define(function(require) {
    var Collection = require('streamhub-sdk/collection');
    var View = require('streamhub-wall');

    return function(el) {
        var collection = new Collection({
            network: "labs-t402.fyre.co",
            environment: "t402.livefyre.com",
            siteId: "303827",
            articleId: 'sh_col_51_1366914813'
        });
        var view = new View({el: el});
        
        collection.pipe(view);
         
        return view;
    };
});
