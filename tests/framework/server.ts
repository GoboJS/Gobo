/// <reference path="framework.ts"/>

declare var require: (string) => any;
declare var module: any;
declare var process: any;

var Handlebars = require("handlebars");

/** Starts a local server that serves up test code */
class Server {

    /** Start a new server */
    start(): void {

        var fs = require('fs');
        var server = require('express')();

        /** Loads fresh test data */
        function load () {

            // `require` caches modules. We need to clear that cache before
            // reloading to ensure we get fresh data
            Object.keys((<any> require).cache).forEach((key) => {
                if ( key.match(/test-data\.js$/) ) {
                    delete (<any> require).cache[key];
                }
            });

            return require('./test-data.js')();
        }

        /** Attempts to read a file, throwing an error if it fails */
        function readFile(
            res: any, path: string,
            fn: (content: string) => void
        ) {
            fs.readFile(path, (err, content) => {
                if (err) {
                    res.sendStatus(500);
                    res.send(err);
                }
                else {
                    fn(content.toString());
                }
            });
        }

        /** Sends back a chunk of HTML */
        function htmlTemplate(res: any, path: string, data: any) {
            readFile(res, path, (html) => {
                var template = Handlebars.compile(html);
                res.set('Content-Type', 'text/html');
                res.send( template(data) );
            });
        }

        /** Serves a javascript file */
        function serveJS (path: string) {
            return (req, res) => {
                readFile(res, path, (data) => {
                    res.set('Content-Type', 'application/javascript');
                    res.send(data);
                });
            };
        }


        // At the root level, list out all of the tests
        server.get('/', (req, res) => {
            var suites = load();

            var data = Object.keys(suites).map(suite => {
                return {
                    suite: suite,
                    tests: Object.keys(suites[suite]).map(test => {
                        return {
                            test: test,
                            url: "/" + encodeURIComponent(suite) +
                                "/" + encodeURIComponent(test)
                        };
                    })
                };
            });

            htmlTemplate(
                res,
                "./tests/framework/listing.handlebars",
                { suites: data }
            );
        });

        // Serve up the required JS files
        server.get('/lib/gobo.js', serveJS('build/gobo.debug.js'));
        server.get('/lib/chai.js', serveJS('node_modules/chai/chai.js'));
        server.get('/lib/watch.js',
            serveJS('node_modules/watchjs/src/watch.js'));
        server.get('/lib/test-framework.js',
            serveJS('build/private/test-framework.js'));
        server.get('/lib/test-harness.js',
            serveJS('build/private/test-harness.js'));

        // Serve an HTML file with a specific test
        server.get('/:suite/:test', (req, res) => {
            var suites = load();

            var bundle = suites[req.params.suite] &&
                suites[req.params.suite][req.params.test];

            if ( bundle ) {
                htmlTemplate(res, "./tests/framework/test.handlebars", {
                    html: bundle.html,
                    logic: bundle.logic.toString()
                });
            }
            else {
                res.sendStatus(404);
                res.send("<html><body><h1>Test not found</h1></body></html>");
            }
        });

        server.listen(8080, () => {
            console.log("Server started");
        });
    }
}

module.exports = function () {
    return new Server();
};

