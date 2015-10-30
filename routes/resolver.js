
get_context = function(req) {
    return req.context;
}

exports.resolve = function(req, res){
    var id = req.params.id;
    var context = get_context(req);

    var parts = id.split(':');

    var url = context[parts[0]];
    if (parts.length == 2) {
        url += parts[1]
    }
    else {
    }

    if (url) {
        res.redirect(url);
    }
    else {
        res.send("DUNNO WHAT TO DO WITH "+path);
    }
};

exports.list = function(req, res){
    var repository = req.repository;
    var context = get_context(req);

    prefixes = []
    for (var k in context) {
        var base_url = context[k];
        prefixes.push({prefix: k, base_url: base_url})
    }

    res.render('prefixes', { repository: 'foo',
                             prefixes: prefixes });
};

exports.info = function(req, res){
    var repository = req.repository;
    var id = req.params.id;
    //var ontology = repository.ontologies.filter(function(x){return x.id == id})[0];
    var ontology = lookup(repository, id);
    var dependencies = ontology.dependencies == null ? [] : ontology.dependencies;
    dependencies = dependencies.map(function(x){return lookup(repository, x.id)});
    dependencies = dependencies.filter(function(x) { return x != null});
    res.render('ontology_info', 
               { ont: ontology,
                 dependencies: dependencies
               });
};

exports.fall_through = function(req, res) {
    var repository = req.repository;
    var path = req.path.replace("/obo/","");
    console.log("OBO: "+path);
    var idmatch = path.match(/^(\S+)_(\S+)$/);
    var url;
    if (idmatch) {
        console.log("Looks like an ID/fragment: "+idmatch);
        var prefix = idmatch[1];
        var fragment = idmatch[2];
        url = "http://www.ontobee.org/browser/rdf.php?o="+prefix+"&iri=http://purl.obolibrary.org/obo/" + path;
    }
    else {
        var match = path.match(/^([\w\-]+)\/(.*)/);
        var prefix = match[1];
        var rest = match[2];
        var ontid = prefix.toLowerCase();
        var ont = lookup(repository, ontid);
        if (ont == null) {
            res.send(500);
        }
        if (ont.redirects) {
            for (var k in ont.redirects) {
                var x = ont.redirects[k];
                if (rest.match(x.match)) {
                    url = rest.replace(x.match, x.url);
                    console.log("REDIRECTING "+path+" ==> "+url);
                    break;
                }
            }
        }
    }

    if (url) {
        res.redirect(url);
    }
    else {
        res.send("DUNNO WHAT TO DO WITH "+path);
    }
    
};
