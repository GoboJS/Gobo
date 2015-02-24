/// <reference path="definition.ts"/>
/// <reference path="if.ts"/>
/// <reference path="each.ts"/>

module Directives {

    /** Creates a one-way directive from a function */
    export function oneway(
        fn: (elem: HTMLElement, value: any) => void
    ): DirectiveBuilder {

        function OneWay ( elem: HTMLElement, details: Directives.Details ) {
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
        if: Directives.IfStatement,

        /** Loop over the values in an iterable */
        'each-*': Directives.EachStatement,

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
