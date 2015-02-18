module Directives {

    /** Directives modify a single element */
    export interface Directive {

        /** Executes this directive against an element with a value */
        execute ( value: any ): void;
    }

    /** Defines the interface for instantiating a Directive */
    export interface DirectiveBuilder {
        new( elem: Element ): Directive
    }


    /** Creates a one-way directive from a function */
    function oneway(
        fn: (elem: Element, value: any) => void
    ): DirectiveBuilder {

        function OneWay ( elem: Element ) {
            this.elem = elem;
        }

        OneWay.prototype.execute = function ( value: any ) {
            fn( this.elem, value );
        }

        return <any> OneWay;
    }


    /** Default list of directives */
    export class DefaultDirectives {
        [key: string]: DirectiveBuilder;
    }

    DefaultDirectives.prototype = {

        /** Sets the text content of an element */
        text: oneway((elem, value) => { elem.textContent = value; }),
    }

}

