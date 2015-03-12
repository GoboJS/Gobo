/// <reference path="definition.ts"/>
/// <reference path="if.ts"/>
/// <reference path="each.ts"/>
/// <reference path="on.ts"/>
/// <reference path="value.ts"/>

module Directives {

    /** Displays the element when a value is truthy */
    function showHide (elem: HTMLElement, value: any): void {
        if ( !this.natural ) {
            this.natural = elem.style.display === "none" ?
                "block" : elem.style.display;
        }
        elem.style.display = value ? this.natural : "none";
    }

    /** Default list of directives */
    export class DefaultDirectives {
        [key: string]: DirectiveBuilder;
    }

    DefaultDirectives.prototype = {

        /** Conditionally include an element */
        "if": Directives.IfStatement,

        /** Loop over the values in an iterable */
        "each-*": Directives.EachStatement,

        /** Attaches an event */
        "on-*": Directives.OnStatement,

        /** Binds to a field value */
        value: Directives.ValueStatement,

        /** Sets the text content of an element */
        text: Directives.directive(function text (elem, value) {
            elem.textContent = (value === undefined ? "" : value);
        }),

        /** Displays the element when a value is truthy */
        show: Directives.directive(showHide),

        /** Hides the element when a value is truthy */
        hide: Directives.directive(function hide (elem, value) {
            showHide.call(this, elem, !value);
        }),

        /** Adds a class name */
        "class-*": Directives.directive(function klass (elem, value) {
            if ( value ) {
                elem.className += " " + this.param;
            }
            else {
                var reg = new RegExp("(\\s|^)" + this.param + "(\\s|$)");
                this.elem.className = this.elem.className.replace(reg, " ");
            }
        })
    };
}
