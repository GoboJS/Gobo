module Directives {

    /** Directives modify a single element */
    export interface Directive {

        /** Executes this directive against an element with a value */
        execute ( value: any ): void;
    }

    /** Defines the interface for instantiating a Directive */
    export interface DirectiveBuilder {
        new( elem: HTMLElement, param?: string ): Directive
    }


    /** Creates a one-way directive from a function */
    function oneway(
        fn: (elem: HTMLElement, value: any) => void
    ): DirectiveBuilder {

        function OneWay ( elem: HTMLElement, param?: string ) {
            this.elem = elem;
            this.param = param;
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

