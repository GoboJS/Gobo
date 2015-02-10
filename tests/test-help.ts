declare var it: (string, any) => void;
declare var exports: any;

export module Tester {

    var jsdom = require("jsdom");

    /** A helper class for interacting with a jsdom document */
    class DocReader {
        /** The document body */
        public body: Element;

        constructor( public document: Document ) {
            this.body = document.body;
        }

        /** Returns text content of a node by id */
        public textById( id: string ): string {
            var elem = this.document.getElementById(id);
            if ( !elem ) {
                throw new Error("Could not find #" + name);
            }
            return elem.textContent;
        }
    }

    /** Executes a test on a thunk of HTML */
    function testHtml(
        testName: string,
        html: string,
        callback: (done: () => void, $: DocReader) => void
    ): void {
        it(testName, (done) => {
            jsdom.env( html, [], function (errors, window) {
                if ( !errors || errors.length === 0 ) {
                    callback( done, new DocReader(window.document) );
                }
                else {
                    done( errors[0] );
                }
            });
        });
    }

    /** Initializes a test */
    export function should ( name: string ) {
        return {
            using: function ( html: string ) {
                return {
                    in: function callback (
                        callback: (done: () => void, $: DocReader) => void
                    ): void {
                        testHtml( "should " + name, html, callback );
                    }
                };
            }
        };
    }
}

