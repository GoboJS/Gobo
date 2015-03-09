/// <reference path="framework.ts"/>

declare var require: (string) => any;
declare var module: any;
declare var process: any;

/** Starts a local server that serves up test code */
function server( suites: Test.SuiteSet ) {
    var fs = require('fs');
    var server = require('express')();

    /** Sends back a chunk of HTML */
    function html(res: any, body: string, head?: string) {
        res.set('Content-Type', 'text/html');
        res.send("<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "<title>Gobo Tests</title>\n" +
            (head ? head + "\n": "") +
            "</head>\n" +
            "<body>\n" + body + "\n</body>\n" +
            "</html>"
        );
    }

    /** Formats an object as an HTML list */
    function asHtmlList(
        obj: { [key: string]: any },
        fn: (key: string) => string
    ): string {
        return "<ul>" +
            Object.keys(obj).map(key => {
                return "<li>" + fn(key) + "</li>";
            }).join("\n") +
            "</ul>";
    }

    // At the root level, list out all of the tests
    server.get('/', function (req, res) {
        html(
            res,
            '<h1>Tests</h1>' +
            asHtmlList(suites, suite => {
                return suite + asHtmlList(suites[suite], test => {
                    var url = "/" + encodeURIComponent(suite) +
                        "/" + encodeURIComponent(test);
                    return "<a href='" + url + "'>" + test + "</a>";
                });
            })
        );
    });

    /** Serves a javascript file */
    function serveJS (path: string) {
        return function (req, res) {
            fs.readFile(path, (err, data) => {
                if (err) {
                    res.status(500);
                    res.send(err);
                }
                else {
                    res.set('Content-Type', 'application/javascript');
                    res.send(data);
                }
            });
        };
    }

    // Serve up the required JS files
    server.get('/lib/gobo.js', serveJS('build/gobo.debug.js'));
    server.get('/lib/chai.js', serveJS('node_modules/chai/chai.js'));
    server.get('/lib/watch.js', serveJS('node_modules/watchjs/src/watch.js'));
    server.get('/lib/test-framework.js',
        serveJS('build/private/test-framework.js'));

    // Serve an HTML file with a specific test
    server.get('/:suite/:test', function (req, res) {
        var bundle = suites[req.params.suite] &&
            suites[req.params.suite][req.params.test];

        if ( bundle ) {
            html(res,
                bundle.html +
                `<script>
                (function (logic) {
                    logic( function(){}, new Test.DocReader(document) );
                }(${bundle.logic}));
                </script>`,
                "<script src='/lib/chai.js'></script>\n" +
                "<script src='/lib/test-framework.js'></script>\n" +
                "<script src='/lib/watch.js'></script>\n" +
                "<script src='/lib/gobo.js'></script>" +
                "<script>var assert = chai.assert</script>"
            );
        }
        else {
            res.status(404);
            html(res, "<h1>Test not found</h1>");
        }
    });

    server.listen(8080);
};

module.exports = {
    start: server
};
