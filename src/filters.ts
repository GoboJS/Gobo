module Filters {

    /** A filter that can be applied to an expression */
    export type FilterFunc = (value: any, ...args: any[]) => any;

    /** A two way filter expressed as an object */
    export type FilterObj = {

        /** Invoked when applying a value to a directive */
        read: FilterFunc;

        /** Invoked when publishing a value back to the model */
        publish: FilterFunc;
    };

    /** Filters can be applied to modify an expression */
    export type Filter = FilterFunc | FilterObj;

    /** Default list of directives */
    export class DefaultFilters {
        [key: string]: Filter;
    }

    DefaultFilters.prototype = {

        /** Invert a value */
        limit: function limitFilter(
            value: Directives.Eachable,
            limit: number
        ): Directives.Eachable {
            return {
                forEach: function limitForEach ( fn: (value: any) => void ) {
                    var calls = 0;
                    value.forEach(value => {
                        if ( calls < limit ) {
                            fn(value);
                            calls++;
                        }
                    });
                }
            };
        },

        /** Invert a value */
        not: function notFilter (value: any): boolean {
            return !value;
        },

        /** Convert a value to uppercase */
        uppercase: function uppercaseFilter (str: string): string {
            return str ? str.toUpperCase() : "";
        },

        /** Convert a value to lowercase */
        lowercase: function lowercaseFilter (str: string): string {
            return str ? str.toLowerCase() : "";
        },

        /** Assert that a value equals anoter value */
        eq: function eqFilter (value: any, other: any): boolean {
            return value === other;
        },

        /** Assert that a value is less than another value */
        lt: function ltFilter (value: any, other: any): boolean {
            return value < other;
        },

        /** Assert that a value is greater than another value */
        gt: function gtFilter (value: any, other: any): boolean {
            return value > other;
        },

        /** Assert that a value is less than or equal to another value */
        lte: function lteFilter (value: any, other: any): boolean {
            return value <= other;
        },

        /** Assert that a value is greater than or equal to another value */
        gte: function gteFilter (value: any, other: any): boolean {
            return value >= other;
        }
    };

}

