
get_context_map = function(req) {
    return req.context_map;
}

get_prefix_map = function(req) {
    var context_map = get_context_map(req);
    var prefix_map = {};
    for (var n in context_map) {
        console.log("Name="+n);
        var context = context_map[n];
        for (var k in context) {
            console.log("  Prefix="+k);
            if (!prefix_map[k]) {
                prefix_map[k] = [];
            }
            prefix_map[k].push(context[k]);
        }
    }
    return prefix_map;
}


exports.resolve = function(req, res){
    var name = req.params.name;
    if (!name) {
        name = req.query.name;
    }
    var context_map = get_context_map(req);

    console.log("NAME:"+name);

    for (var n in context_map) {

        console.log("N:"+n);
        var context = context_map[n];
        var url = expand_name(name, context);
        if (url) {
            res.redirect(url);
        }
    }
    res.send("DUNNO WHAT TO DO WITH "+name);
};

multi_expand = function(name, context_map) {
    for (var n in context_map) {

        console.log("N:"+n);
        var context = context_map[n];
        var url = expand_name(name, context);
        if (url) {
            res.redirect(url);
        }
    }

};

exports.info = function(req, res){
    var name = req.params.name;
    if (!name) {
        name = req.query.name;
    }
    var context_map = get_context_map(req);

    console.log("NAME:"+name);

    for (var n in context_map) {

        console.log("N:"+n);
        var context = context_map[n];
        var url = expand_name(name, context);
        if (url) {
            res.redirect(url);
        }
    }
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

expand_name = function(name, context, depth) {

    console.log("EXP: "+name);
    var parts = name.split(':');

    if (parts.length == 2) {
        var prefix = parts[0];

        console.log("  CURIE: "+name+" PREFIX: "+prefix);

        if (context[prefix]) {
            var x = context[prefix];
            x += parts[1];
            return x;
        }
    }
    else {
        if (context[name]) {
            var x = context[name];
            console.log("  "+name+" --> "+x);
            if (x.indexOf("http") == 0) {
                return x;
            }
            else {
                if (depth > 20) {
                    return;
                }
                // todo: guard against recursive loop
                return expand_name(x, context, depth+1);
            }
        }
    }
}

exports.list = function(req, res){
    var repository = req.repository;
    var prefix_map = get_prefix_map(req);

    prefixes = []
    
    for (var k in prefix_map) {
        
        var base_urls = prefix_map[k];
        console.log(k + " ==> " + base_urls);
        prefixes.push({prefix: k, base_urls: base_urls})
    }

    res.render('prefixes', { repository: 'foo',
                             prefixes: prefixes });
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
