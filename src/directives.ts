module Directives {

    /** Directives modify a single element */
    export interface Directive {

        /** Executes this directive against an element with a value */
        execute ( value: any ): void;

        /** Called once when hooking up this directive */
        initialize?: () => void;

        /** Hooks up the behavior for this directive */
        connect?: () => void;

        /** Unhooks the behavior for this directive */
        disconnect?: () => void;
    }

    /** Detailed info about how a directive is constructed */
    interface Details {

        /** The wildcard parameter from the directive name */
        param?: string;

        /** A function for parsing the nested values from a directive */
        parse: () => Parse.Section;
    }

    /** Defines the interface for instantiating a Directive */
    export interface DirectiveBuilder {
        new( elem: HTMLElement, details: Details ): Directive
    }


    /** Adds and removes elements based on an expression */
    class IfStatement implements Directive {

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

    /** Creates a one-way directive from a function */
    export function oneway(
        fn: (elem: HTMLElement, value: any) => void
    ): DirectiveBuilder {

        function OneWay ( elem: HTMLElement, details: Details ) {
            this.elem = elem;
            this.param = details.param;
        }

        OneWay.prototype.execute = function ( value: any ) {
            fn.call( this, this.elem, value );
        }

        return <any> OneWay;
    }


    /** Default list of directives */
    export class DefaultDirectives {
        [key: string]: DirectiveBuilder;
    }

    DefaultDirectives.prototype = {

        /** Conditionally include an element */
        if: IfStatement,

        /** Sets the text content of an element */
        text: oneway(function textDirective (elem, value) {
            elem.textContent = value;
        }),

        /** Adds a class name */
        'class-*': oneway(function (elem, value) {
            if ( value ) {
                elem.className += " " + this.param;
            }
            else {
                var reg = new RegExp('(\\s|^)' + this.param + '(\\s|$)');
                this.elem.className = this.elem.className.replace(reg, ' ');
            }
        })
    }

}

