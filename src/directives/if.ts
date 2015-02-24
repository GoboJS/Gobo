/// <reference path="definition.ts"/>

module Directives {

    /** Adds and removes elements based on an expression */
    export class IfStatement implements Directive {

        /** The fragment standing in for the element */
        private standin: Node;

        /** The directives nested within this If statement */
        private section: Parse.Section;

        /** @inheritdoc Directive#connect */
        public connect: () => void;

        /** @inheritdoc Directive#disconnect */
        public disconnect: () => void;

        /** @inheritdoc Directive#constructor */
        constructor( private elem: Node, details: Details ) {
            this.standin = elem.ownerDocument.createComment("if");
            this.section = details.parse();

            this.connect = this.section.connect.bind(this.section);
            this.disconnect = this.section.disconnect.bind(this.section);
        }

        /** @inheritdoc Directive#execute */
        execute ( value: any ): void {
            if ( value && !this.elem.parentNode ) {
                this.section.connect();
                this.standin.parentNode.replaceChild(this.elem, this.standin);
            }
            else if ( !value && this.elem.parentNode ) {
                this.section.disconnect();
                this.elem.parentNode.replaceChild(this.standin, this.elem);
            }
        }

        /** @inheritdoc Directive#initialize */
        initialize (): void {
            this.section.initialize();
        }
    }
}
