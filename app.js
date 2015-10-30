
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var resolver = require('./routes/resolver');
var http = require('http');
var path = require('path');
var request = require('request');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var repository;

var yaml = require('js-yaml');
var fs   = require('fs');
var context_map = {}

var source_map = {
    "obo_context": "https://raw.githubusercontent.com/cmungall/biocontext/master/registry/obo_context.jsonld",
    "semweb_vocab_context": "https://raw.githubusercontent.com/cmungall/biocontext/master/registry/semweb_vocab_context.jsonld",
    "semweb_context": "https://raw.githubusercontent.com/cmungall/biocontext/master/registry/semweb_context.jsonld"
};

var load_context = function(name, url) {
    console.log("Loading:"+name+" "+url);

    request({
        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            context_map[name] = body['@context']
        }
    })
};

for (var n in source_map) {
    load_context(n, source_map[n]);
}

// Make our repository accessible to our router
app.use(function(req,res,next){
    req.context_map = context_map;
    next();
});


 
app.get('/', resolver.list);
app.get('/resolve/:name', resolver.resolve);
app.get('/resolve', resolver.resolve);
app.get('/info/:name', resolver.resolve);
app.get('/info', resolver.resolve);
//app.get('/ontologies', ontology.list);
//app.get('/ontology/:id', ontology.info);
//app.get('/obo/*', ontology.fall_through);
app.get('/about', 
        function(req, res){ res.render('about')});




/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        console.error("ERRPR");
        console.error(err.stack);
        //res.render('error', {
        //    message: err.message,
        //    error: err
        //});
        res.send(500);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    //res.render('error', {
    //    message: err.message,
    //    error: {}
    //});
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
