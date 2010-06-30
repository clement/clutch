var clutch = exports,
    url    = require('url'),
    slice  = Array.prototype.slice;

var Route = function (method, path_re, callback) {
    this.method = method;
    this.path_re = path_re;
    this.callback = callback;
}
Route.prototype.match = function (req, resp) {
    // Call the route callback with captured parameters
    // if the request URL match
    //
    // Return `true` if the request matched, `false` otherwise

    // `*` match on all methods
    if (this.method == '*' || this.method.toLowerCase() == req.method.toLowerCase()) {
        var parts,
            path = url.parse(req.url).pathname;

        if (parts = path.match(this.path_re)) {
            this.callback.apply(null, slice.apply(arguments).concat(slice.apply(parts, [1])));
            return true;
        }
    }

    return false;
}


clutch.route = function (urls, req, res) {
    // If called without request and response parameters,
    // it will return a routing function, otherwise
    // it directly route the request

    var url_re = /^(\S+)\s(.*)$/;
    var routes = [];

    var i;
    var parts;
    for (i in urls) {
        if(!(parts = urls[i][0].match(url_re))) {
            throw new Error('invalid URL : `'+urls[i][0]+'`');
        }

        routes.push(new Route(parts[1], new RegExp('^'+parts[2]), urls[i][1]));
    }

    var _route = function(req, res) {
        var i;
        for (i in routes) {
            if (routes[i].match(req, res)) {
                return;
            }
        }

        res.writeHead(404);
        res.end();
    }

    if (req && res) {
        _route(req, res);
    }
    else {
        return _route;
    }
}
