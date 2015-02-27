/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Attaches an observer */
    export class OnStatement implements Directive {

        /** @inheritDoc DirectiveBuilder#allowFunction */
        public static allowFuncs = true;

        /** The event to listen to */
        private event: string;

        /** The event handler */
        private handler: ( evt: Event ) => void;

        /** Whether the handler is connected */
        private connected: boolean = false;

        /** @inheritDoc Directive#constructor */
        constructor( private elem: Node, details: Details ) {
            this.event = details.param;
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            this.disconnect();

            this.handler = (evt) => {
                evt.preventDefault();
                value();
            };

            this.connect();
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

