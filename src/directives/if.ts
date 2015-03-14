/// <reference path="definition.ts"/>

module Directives {

    /** Adds and removes elements based on an expression */
    export class IfStatement implements Directive {

        /** @inheritDoc DirectiveBuilder#priority */
        public static priority = 100;

        /** The fragment standing in for the element */
        private standin: Node;

        /** @inheritDoc Connection#connect */
        public connect: () => void;

        /** @inheritDoc Connect#disconnect */
        public disconnect: () => void;

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
        constructor( private elem: Node, details: Details ) {
            this.standin = elem.ownerDocument.createComment("if");
            var section = details.parse();

            this.connect = section.connect.bind(section);
            this.disconnect = section.disconnect.bind(section);
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            if ( value && !this.elem.parentNode ) {
                this.connect();
                this.standin.parentNode.replaceChild(this.elem, this.standin);
            }
            else if ( !value && this.elem.parentNode ) {
                this.disconnect();
                this.elem.parentNode.replaceChild(this.standin, this.elem);
            }
        }
    }
}
