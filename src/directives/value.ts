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

        /** Event handler for input events */
        private handler = () => {
            this.publish( this.elem.value );
        };

        /** @inheritDoc Directive#constructor */
        constructor( elem: HTMLElement, details: Details ) {
            this.elem = <HTMLInputElement> elem;
            this.publish = details.publish;
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
                this.elem.addEventListener("input", this.handler);
            }
        }

        /** @inheritDoc Directive#disconnect */
        disconnect(): void {
            if ( this.handler ) {
                this.connected = false;
                this.elem.removeEventListener("input", this.handler);
            }
        }
    }
}


