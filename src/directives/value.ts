/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Attaches an observer */
    export class ValueStatement implements Directive {

        /** The form element */
        private elem: HTMLInputElement;

        /** Whether the handler is connected */
        private connected: boolean = false;

        /** Sets the value */
        private publish: (value: any) => void;

        /** The event to monitor */
        private event: string;

        /** Event handler for input events */
        private handler = () => {
            this.publish( this.elem.value );
        };

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
        constructor( elem: HTMLElement, details: Details ) {
            this.elem = <HTMLInputElement> elem;
            this.publish = details.publish;
            this.event = elem.tagName === "SELECT" ? "change" : "input";
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            if ( this.elem.value !== value ) {
                this.elem.value = value;
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


