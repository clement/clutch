var assert = require('assert'),
    sys    = require('sys'),
    clutch = require('./index'),
    slice  = Array.prototype.slice;

function MockRequest(method, url) {
    this.method = method;
    this.url = url;
}

function MockResponse(name, id, code, body) {
    this.name = name;
    this.body = body || '';
    this.id = id;
    this.code = code;
    this.buffer = '';
}
MockResponse.prototype.writeHead = function (code, reason, headers) {
    assert.equal(code, this.code, this.name+': Invalid return code, expected `'+this.code+'` (got `'+code+'`)');
}
MockResponse.prototype.write = function (content) {
    this.buffer += content.toString();
}
MockResponse.prototype.end = function (id) {
    assert.equal(id, this.id, this.name+': Invalid function id, expected `'+this.id+'` (got `'+id+'`)');
    assert.equal(this.buffer, this.body, this.name+': Invalid response body, expected `'+this.body+'` (got `'+this.buffer+'`)');
    sys.print('.');
}


function echo(id) {
    return function (req, resp) {
        resp.writeHead(200);

        var args = slice.apply(arguments, [2]);
        if (args.length) {
            resp.write(JSON.stringify(args));
        }
        resp.end(id);
    };
}


function testInvalidRoute() {
    assert.throws(function () { clutch.route([['']]); }, 'testInvalidRoute1');
    assert.throws(function () { clutch.route([['/$']]); }, 'testInvalidRoute2');
    assert.throws(function () { clutch.route([['GET/$']]); }, 'testInvalidRoute3');
    assert.throws(function () { clutch.route([['GET']]); }, 'testInvalidRoute4');
}

function testBasic() {
    var router = clutch.route([['GET /$', echo(1)],
                               ['POST /$', echo(2)],
                               ['* /$', echo(3)]]);

    assert.ok(router(new MockRequest('GET', '/'), new MockResponse('testBasic1', 1, 200)), 'testBasic1');
    assert.ok(router(new MockRequest('POST', '/'), new MockResponse('testBasic3', 2, 200)), 'testBasic2');
    assert.ok(router(new MockRequest('OPTIONS', '/'), new MockResponse('testBasic4', 3, 200)), 'testBasic3');
    assert.ok(!router(new MockRequest('GET', '/foo/'), new MockResponse('testBasic4')), 'testBasic4');
}

function test404() {
    var router = clutch.route404([['GET /onlyget/$', echo(1)],
                                ['POST /onlypost/$', echo(2)],
                                ['* /everything/$', echo(3)]]);
    router(new MockRequest('GET', '/onlypost/'), new MockResponse('test404-1', undefined, 404));
    router(new MockRequest('OPTIONS', '/everything/andbeyond/'), new MockResponse('test404-2', undefined, 404));
}

function testNoRoutes() {
    var router = clutch.route([]);

    assert.ok(!router(new MockRequest('GET', '/'), new MockResponse('testNoRoutes1')), 'testNoRoutes1');
}

function testDynamicRoutes() {
    var routes = [['GET /$', echo(1)],
                  ['POST /$', echo(2)]];

    clutch.route404(routes, new MockRequest('GET', '/'), new MockResponse('testDynamic1', 1, 200));
    clutch.route404(routes, new MockRequest('POST', '/'), new MockResponse('testDynamic2', 2, 200));
}

function testPriority() {
    var router = clutch.route404([['GET /foo/$', echo(1)],
                               ['* /', echo(2)],
                               ['POST /foo/$', echo(3)]]);
    router(new MockRequest('GET', '/foo/'), new MockResponse('testPriority1', 1, 200));
    router(new MockRequest('POST', '/foo/'), new MockResponse('testPriority2', 2, 200));
}

function testParams() {
    var router = clutch.route404([['* /(\\w+)/$', echo(1)],
                               ['* /(\\w+)(/?)(\\w*)$', echo(2)]]);
    router(new MockRequest('GET', '/foo/'), new MockResponse('testParams1', 1, 200, '["foo"]'));
    router(new MockRequest('GET', '/foo'), new MockResponse('testParams2', 2, 200, '["foo","",""]'));
    router(new MockRequest('GET', '/foo/bar'), new MockResponse('testParams3', 2, 200, '["foo","/","bar"]'));
}

var tests = [
    testInvalidRoute,
    testBasic,
    test404,
    testNoRoutes,
    testDynamicRoutes,
    testPriority,
    testParams
];

sys.log('Test suite started');

var i, errors = [];
for (i in tests) {
    try {
        tests[i]();
        sys.print('.');
    }
    catch (e) {
        errors.push(e);
        sys.print('E');
    }
}

if (errors.length) {
    sys.puts('\n');
    for (i in errors) {
        sys.puts(errors[i]);
    }
}
else {
    sys.puts('\n\nAll tests passed.');
}
