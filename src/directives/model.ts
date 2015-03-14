/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Attaches an observer */
    export class ModelStatement implements Directive {

        /** The form element */
        private elem: HTMLInputElement;

        /** Whether the handler is connected */
        private connected: boolean = false;

        /** The event to monitor */
        private event: string;

        /** Event handler for input events */
        private handler: () => void;

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
        constructor( elem: HTMLElement, details: Details ) {
            this.elem = <HTMLInputElement> elem;
            this.event = elem.tagName === "SELECT" ? "change" : "input";

            this.handler = function modelHandler() {
                details.publish( (<HTMLInputElement> elem).value );
            };
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            if ( this.elem.tagName !== "SELECT" ) {
                if ( this.elem.value !== value ) {
                    this.elem.value = value;
                }
            }
            else {
                [].forEach.call(this.elem.children, (elem) => {
                    if ( elem.value === value ) {
                        elem.selected = true;
                    }
                });
            }
        }

        /** @inheritDoc Directive#connect */
        connect(): void {
            if ( this.handler && !this.connected ) {
                this.connected = true;
                this.elem.addEventListener(this.event, this.handler);
            }
        }

        /** @inheritDoc Directive#disconnect */
        disconnect(): void {
            if ( this.handler ) {
                this.connected = false;
                this.elem.removeEventListener(this.event, this.handler);
            }
        }
    }
}


