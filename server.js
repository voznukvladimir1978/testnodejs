var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    querystring = require('querystring'),
    formidable = require("formidable");

var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '{0}'+
    '</form>'+
    '</body>'+
    '</html>';

String.prototype.format = function() {
    a = this;
    for (k in arguments) {
        a = a.replace("{" + k + "}", arguments[k])
    }
    return a
}

function _start(response, request) {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write((body.format("")));
    response.end();
}

function _upload(response, request) {

    var frontendformat = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d{1,5} ssl/ig;
    var aclformat = /acl\s(.*?)\shdr_end\(host\)/ig
    var form = new formidable.IncomingForm();
    console.log("about to parse");
    form.parse(request, function(error, fields, files) {
        var fileContent = fs.readFileSync(files.upload.path, "utf8");
        var result=frontendformat.exec(fileContent);
        var lstr = "<ul>";
        while (result) {
            lstr = lstr+"<li>"+result[1];
            var li = "<li>{0}</li>";
            var result1 = aclformat.exec(fileContent);
            while (result1) {
                lstr = lstr+"<ul><li>"+result1[1]+"<ul>";
                var lindexn=fileContent.indexOf("\n", aclformat.lastIndex)
                var lstrkeys = fileContent.substring(aclformat.lastIndex, lindexn);
                var lkeys = lstrkeys.split(/\s*-i\s*/);
                for (var i = 1; i < lkeys.length; i++) {
                    lstr = lstr + li.format(lkeys[i]);
                }
                lstr = lstr + "</ul></li></ul>";
                result1 = aclformat.exec(fileContent);
            }
            lstr = lstr + "</li>";
            result = frontendformat.exec(fileContent);
        }
        lstr = lstr+"</ul>";
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write((body.format("<div>SSL Frontends:</div><div>"+lstr+"</div>")));
        response.end();
    });
}

function _route(handle, pathname, response, request) {
    if (typeof handle[pathname] === 'function') {
        handle[pathname](response, request);
    } else {
        response.writeHead(404, {"Content-Type": "text/html"});
        response.write("404 Not found");
        response.end();
    }
}

function start(route, handle) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        _route(handle, pathname, response, request);
    }

    http.createServer(onRequest).listen(7777);
}

var handle = {}
handle["/"] = _start;
handle["/upload"] = _upload;

start(_route, handle);