module Directives {

    /** Directives modify a single element */
    export interface Directive {

        /** Executes this directive against an element with a value */
        execute ( value: any ): void;
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

        /** @inheritdoc Block#constructor */
        constructor( private elem: Node ) {
            this.standin = elem.ownerDocument.createComment("if");
        }

        /** @inheritdoc Modifier#execute */
        execute ( value: any ): void {
            if ( value && !this.elem.parentNode ) {
                this.standin.parentNode.replaceChild(this.elem, this.standin);
            }
            else if ( !value && this.elem.parentNode ) {
                this.elem.parentNode.replaceChild(this.standin, this.elem);
            }
        }
    }

    /** Creates a one-way directive from a function */
    function oneway(
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

