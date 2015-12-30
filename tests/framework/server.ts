/// <reference path="framework.ts"/>
/// <reference path="es6-promise.d.ts"/>

declare var require: (string) => any;
declare var module: any;
declare var process: any;

var fs = require('fs');
var Handlebars = require("handlebars");
var Q = require("q");

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

/** Given a list of file paths, returns the time of the most recent change */
function newestMTime ( paths: string[] ): number {
    return paths.reduce((maxTime: number, path: string) => {
        var stat = fs.statSync(path);
        if ( !stat ) {
            throw new Error("Could not stat " + path);
        }
        return Math.max(maxTime, stat.mtime);
    }, 0);
}

// The JS files needed to run an individual test
var testJS = [
    'node_modules/chai/chai.js',
    'build/private/test-runner.js',
    'node_modules/watchjs/src/watch.js'
];

// The library JS, served separately to make debugging easier
var goboJS = ['build/gobo.debug.js'];

/** Returns a future containing the HTML of a test */
function getTestHTML(
    enableCache: boolean,
    bundle: Test.Bundle,
    testId: number = 0
): Promise<string> {

    return Q.nfcall(
        fs.readFile,
        "./tests/framework/test.handlebars",
        "utf-8"
    ).then(content => {
        var template = Handlebars.compile(content);
        return template({
            testId: testId,
            stylize: testId === 0,
            html: bundle.html,
            logic: bundle.logic.toString(),
            jsHash: enableCache ?  newestMTime(testJS.concat(goboJS)) : "-"
        });
    });
}

/** Serves a javascript file */
function serveJS (cache: boolean, paths: string[]) {
    return (req, res) => {
        Q.all(
            paths.map(path => {
                return Q.nfcall(fs.readFile, path, "utf-8")
            })
        ).then(
            (content: string[]) => {
                if ( cache ) {
                    res.set('Content-Type', 'application/javascript');
                    res.set('Cache-Control', 'public, max-age=300');
                }
                content.forEach(data => {
                    res.write(data);
                    res.write("\n");
                });
                res.end();
            },
            (err) => {
                res.sendStatus(500);
                res.send(err);
            }
        );
    };
}

/** Serves a map of test suites */
function serveSuiteList (
    enableCache: boolean,
    res: any,
    suites: Test.SuiteSet
): void {

    var autoinc = 0;

    var suitePromise = Q.all( Object.keys(suites).map(suite => {

        var testPromises = Object.keys(suites[suite]).map(test => {
            var bundle = suites[suite][test];
            var testId = ++autoinc;
            return getTestHTML(enableCache, bundle, testId).then(html => {
                return {
                    test: test,
                    url: "/" + encodeURIComponent(suite) +
                        "/" + encodeURIComponent(test),
                    content: html,
                    testId: testId
                };
            });
        });

        return Q.all(testPromises).then(testList => {
            return {
                suite: suite,
                url: "/" + encodeURIComponent(suite),
                tests: testList
            };
        });
    }) );

    readFile(res, "./tests/framework/listing.handlebars", (html) => {
        suitePromise.then(data => {
            var template = Handlebars.compile(html);
            res.set('Content-Type', 'text/html');
            res.send( template({ suites: data }) );
        });
    });
}

/** Starts a local server that serves up test code */
class Server {

    /** Start a new server */
    start( enableCache: boolean ): void {

        var server = require('express')();

        // enable gzip compression
        server.use( require('compression')() );

        // At the root level, list out all of the tests
        server.get('/', (req, res) => {
            serveSuiteList(enableCache, res, load());
        });

        //Serve a single test suite
        server.get('/:suite', (req, res) => {
            var suites = load();

            if ( suites[req.params.suite] ) {
                var single: Test.SuiteSet = {};
                single[req.params.suite] = suites[req.params.suite];
                serveSuiteList(enableCache, res, single);
            }
            else {
                res.sendStatus(404);
            }
        });

        // The JS needed for running all the tests
        server.get('/lib/test-harness.js', serveJS(false, [
            'build/private/test-harness.js'
        ]));

        server.get('/lib/*/test.js', serveJS(enableCache, testJS));

        // Serve the Gobo JS separately to make it easier to debug
        server.get('/lib/*/gobo.js', serveJS(enableCache, goboJS));

        // Serve an HTML file with a specific test
        server.get('/:suite/:test', (req, res) => {
            var suites = load();

            var bundle = suites[req.params.suite] &&
                suites[req.params.suite][req.params.test];

            if ( bundle ) {
                getTestHTML(enableCache, bundle).then((html) => {
                    res.set('Content-Type', 'text/html');
                    res.send(html);
                }, (err) => {
                    res.sendStatus(500);
                    res.send(err);
                });
            }
            else {
                res.sendStatus(404);
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

