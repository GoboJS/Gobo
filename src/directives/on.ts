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

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
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

        /** @inheritDoc Connection#connect */
        connect(): void {
            if ( this.handler ) {
                this.elem.addEventListener(this.event, this.handler);
            }
        }

        /** @inheritDoc Connect#disconnect */
        disconnect(): void {
            if ( this.handler ) {
                this.elem.removeEventListener(this.event, this.handler);
            }
        }
    }
}

