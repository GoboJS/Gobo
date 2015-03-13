/// <reference path="framework.ts"/>

declare var require: (string) => any;
declare var it: (string, any) => void;
declare var describe: (string, any) => void;

module Test {

    var jsdom = require("jsdom");

    /** Executes a test on a thunk of HTML */
    function testHtml( testName: string, html: string, callback: Logic ): void {
        it(testName, (done) => {
            jsdom.env( html, [], function (errors, window) {
                if ( !errors || errors.length === 0 ) {
                    callback( done, new Test.DocReader(window.document) );
                }
                else {
                    done( errors[0] );
                }
            });
        });
    }

    /** Initializes a test */
    function should ( name: string ) {
        return {
            using: function using ( html: string ) {
                return {
                    in: function callback ( callback: Logic ): void {
                        testHtml( name, html, callback );
                    }
                };
            }
        };
    }

    /** Defines a test suite */
    export function test(name: string, tests: ( should: Should ) => void) {
        describe(name + " should...", tests.bind(null, should));
    }
}

