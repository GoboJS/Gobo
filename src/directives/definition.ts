/// <reference path="../data.ts"/>
/// <reference path="../connect.ts"/>
/// <reference path="../expression.ts"/>

module Directives {

    /** Directives modify a single element */
    export interface Directive extends Connect.Connectable {

        /** Executes this directive against an element with a value */
        execute ( value: any ): void;
    }

    /** Detailed info about how a directive is constructed */
    export interface Details {

        /** The wildcard parameter from the directive name */
        param?: string;

        /** The expression feeding the value of a directive */
        expression: Expr.Atom;

        /** Access to the data */
        data: Data.Data;

        /** A function for parsing the nested values from a directive */
        parse( scope?: Data.Data ): Parse.Section;

        /** A function for parsing the nested values from a directive */
        cloneable(): Parse.Cloneable;

        /** Sets the value of the expression that fed the directive */
        publish( value: any ): void;
    }

    /** Defines the interface for instantiating a Directive */
    export interface DirectiveBuilder {
        new( elem: HTMLElement, details: Details ): Directive

        /**
         * The priority of this directive relative to other directives. When
         * multiple directives are attached to an element, the higher priority
         * will be applied first.
         */
        priority?: number;

        /** Whether this directive alllows functions to be passed to it */
        allowFuncs?: boolean;
    }


    /** Used to define custom directives from simple plain objects */
    export interface CustomDirectiveObj {
        priority?: number;
        allowFuncs?: boolean;
        construct?: (elem: HTMLElement, details: Directives.Details) => void;
        execute: (value: any) => void;
        connect?: () => void;
        disconnect?: () => void;
    }

    /** Builds a directive from a single function */
    type CustomDirectiveFn = (elem: HTMLElement, value: any) => void;

    /** Possible inputs for building custom directives */
    type CustomDirective = CustomDirectiveObj | CustomDirectiveFn;

    /** Creates a directive from an object */
    function directiveFromObj( obj: CustomDirectiveObj ): DirectiveBuilder {

        /** Base function for a custom directive */
        function Custom(elem: HTMLElement, details: Directives.Details) {
            if ( obj.construct ) {
                obj.construct.call(this, elem, details);
            }
        }

        (<any> Custom).priority = obj.priority;
        (<any> Custom).allowFuncs = obj.allowFuncs;

        Custom.prototype = obj;

        return <any> Custom;
    }

    /** Creates a one-way directive from a function */
    function directiveFromFn( fn: CustomDirectiveFn ): DirectiveBuilder {

        /** Base function for a custom directive */
        function Custom( elem: HTMLElement, details: Directives.Details ) {
            this.elem = elem;
            this.param = details.param;
            this.publish = details.publish;
            this.data = details.data;
        }

        Custom.prototype.execute = function execute( value: any ) {
            fn.call( this, this.elem, value );
        };

        return <any> Custom;
    }

    /** Builds a directive */
    export function directive( source: CustomDirective ): DirectiveBuilder {
        if ( typeof source === "function" ) {
            return directiveFromFn(<any> source);
        }
        else {
            return directiveFromObj(<any> source);
        }
    }

}

