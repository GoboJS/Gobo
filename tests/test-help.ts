declare var it: (string, any) => void;
declare var exports: any;

module Test {

    var jsdom = require("jsdom");

    /** A helper class for interacting with a jsdom document */
    class DocReader {
        /** The document body */
        public body: Element;

        constructor( private document: Document ) {
            this.body = document.body;
        }

        /** Returns a node by ID */
        public byId( id: string ): HTMLElement {
            var elem = this.document.getElementById(id);
            if ( !elem ) {
                throw new Error("Could not find #" + id);
            }
            return elem;
        }

        /** Returns whether an ID exists in the document */
        public idExists( id: string ): boolean {
            return this.document.getElementById(id) ? true : false;
        }

        /** Returns text content of a node by id */
        public textById( id: string ): string {
            return this.byId(id).textContent;
        }

        /** Removes dirty whitespace from a string */
        public cleanup( str: string ): string {
            return str.trim().replace(/\s\s+/g, " ");
        }

        /** Returns whether an element has a class */
        public hasClass( elem: HTMLElement, klass: string ): boolean {
            return elem.className.split(" ").indexOf(klass) !== -1;
        }

        /** Triggers a click event */
        public click ( elem: HTMLElement ): void {
            var clickevent = this.document.createEvent("MouseEvents");
            clickevent.initEvent("click", true, true);
            elem.dispatchEvent(clickevent);
        }

        /** Triggers event an event on the given ID */
        public clickById ( id: string ): void {
            this.click( this.byId(id) );
        }

        /** Returns a field  */
        public fieldById ( id: string ): HTMLInputElement {
            return <HTMLInputElement> this.byId(id);
        }

        /** Simulates typing into a field */
        public typeInto ( id: string, value: string ): void {
            var elem = this.fieldById(id)
            elem.value = value;
            var event = this.document.createEvent("InputEvent");
            event.initEvent("input", true, true);
            elem.dispatchEvent(event);
        }

        /** Returns whether an element is visible */
        public isVisible ( id: string ): boolean {
            return this.fieldById(id).style.display !== "none";
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

