/// <reference path="definition.ts"/>
/// <reference path="if.ts"/>
/// <reference path="each.ts"/>

module Directives {

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
        text: Directives.directive(function text (elem, value) {
            elem.textContent = value;
        }),

        /** Adds a class name */
        'class-*': Directives.directive(function klass (elem, value) {
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
