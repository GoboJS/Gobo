declare var require: (string) => any;

/**
 * A testing framework designed to allow locally run unit tests using jsdom,
 * and remotely run unit tests using webdriver.
 */
module Test {

    /** A helper class for interacting with a jsdom document */
    export class DocReader {

        /** The document body */
        public body: HTMLElement;

        constructor( private document: Document ) {
            this.body = document.body;
        }

        /** Creates a new node */
        public create( tag: string, content?: any ): HTMLElement {
            var elem = this.document.createElement(tag);
            if ( typeof content === "string" ) {
                elem.textContent = content;
            }
            return elem;
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
            var event = this.document.createEvent("UIEvent");
            event.initEvent("input", true, true);
            elem.dispatchEvent(event);
        }

        /** Returns whether an element is visible */
        public isVisible ( id: string ): boolean {
            return this.fieldById(id).style.display !== "none";
        }

        /** Triggers a 'keyup' event */
        public keyup ( id: string, keyCode: number ): void {
            var event = this.document.createEvent("KeyboardEvent");

            var init = (<any> event).initKeyboardEvent ||
                (<any> event).initKeyEvent ||
                (<any> event).initEvent;

            init.call(event,
                "keyup", true, true, null,
                false, false, false, false,
                keyCode, keyCode
            );

            // This hack is needed to make Chromium pick up the keycode.
            // Otherwise, keyCode will always be zero
            Object.defineProperty(event, 'keyCode', {
                get : function() {
                    return keyCode;
                }
            });

            this.fieldById(id).dispatchEvent(event);
        }

        /** Changes the state of a checkbox */
        public setCheckbox ( elem: HTMLInputElement, checked: boolean ): void {
            elem.checked = checked;

            var event = this.document.createEvent("HTMLEvents");
            event.initEvent("change", false, true);
            elem.dispatchEvent(event);
        }
    }

    /** The function for executing a test */
    export type Logic = (done: () => void, $: DocReader) => void;

    /** Bunded data about a test */
    export interface Bundle {
        html: string;
        logic: Logic;
    }

    /** A suite is a set of named tests */
    export type Suite = { [name: string]: Bundle };

    /** All registered suites */
    export type SuiteSet = { [name: string]: Suite };

    /** Fluent test definition */
    export type Should = (name: string) => {
        using: ( html: string ) => {
            in: ( callback: Logic ) => void
        };
    };

    /** Defines a test suite */
    export type test = (name: string, tests: (should: Should) => void) => void;
}

