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

        /** A function for parsing the nested values from a directive */
        cloneable: () => Parse.Cloneable;

        /** Access to the data */
        data: Data;
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

    /** Loops over a value */
    class EachStatement implements Directive {

        /**
         * Marks the final position of the list so new elements can quickly
         * be appended using 'insertBefore'
         */
        private end: Node;

        /** The section to clone for each sub-element */
        private template: Parse.Cloneable;

        /** Creates a scoped data object */
        private scope: (value: any) => Data;

        /** @inheritdoc Directive#constructor */
        constructor( elem: Node, details: Details ) {
            this.end = elem.ownerDocument.createTextNode("");
            this.template = details.cloneable();

            this.scope = (value) => {
                return details.data.scope(details.param, value);
            };
        }

        /** @inheritdoc Directive#initialize */
        initialize (): void {
            // Replace the root DOM element with the placeholder
            this.template.root.parentNode.replaceChild(
                this.end, this.template.root );
        }

        /** @inheritdoc Directive#execute */
        execute ( value: any ): void {
            value.forEach((value: any) => {

                var newSection = this.template.cloneBefore(
                    this.end, this.scope(value));

                newSection.initialize();
                newSection.connect();
            });
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

        /** Loop over the values in an iterable */
        'each-*': EachStatement,

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

