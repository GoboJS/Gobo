/// <reference path="../data.ts"/>

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
    export interface Details {

        /** The wildcard parameter from the directive name */
        param?: string;

        /** Access to the data */
        data: Data.Data;

        /** A function for parsing the nested values from a directive */
        parse(): Parse.Section;

        /** A function for parsing the nested values from a directive */
        cloneable(): Parse.Cloneable;
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
    }
}

