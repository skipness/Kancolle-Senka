var express = require('express');
var packageInfo = require('./package.json');

var app = express();

app.get('/', function(req, res){
  res.json({version: packageInfo.version});
});

var server = app.listen(8088);
