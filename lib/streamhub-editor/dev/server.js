var express = require('express');
var pubDir = __dirname + '/..';

var app = express();

app.use('/', express.static(pubDir));
app.listen(8080);
