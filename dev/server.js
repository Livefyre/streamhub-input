#!/usr/bin/env node

var express = require('express');
var lessMiddleware = require('less-middleware');
var pubDir = __dirname + '/..';
var lfBootstrapFonts = pubDir + '/lib/livefyre-bootstrap/src/fonts';
var lfBootstrapImages = pubDir + '/livefyre-bootstrap/src/images';

var app = express();

app.use(lessMiddleware({
    src: '/src/styles',
    dest: '/dev/css',
    compress: false,
    force: true,
    root: pubDir,
    paths: [pubDir, 'lib']
}));

app.use('/dev/css/fonts', express.static(lfBootstrapFonts));
app.use('/', express.static(pubDir));

app.listen(8089);
