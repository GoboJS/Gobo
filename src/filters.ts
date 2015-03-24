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

        /** Capitalize the first character of a string */
        capitalize: function capitalizeStr( value: string ): string {
            return value.charAt(0).toUpperCase() + value.slice(1);
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
        },

        /** Wraps a keyboard event handler and filters by key code */
        key: function keyFilter (
            callback: (event: KeyboardEvent, ...args: any[]) => any,
            key: string
        ): (event: KeyboardEvent, ...args: any[]) => any {
            var keyCodes = {
                enter: 13,
                tab: 9,
                delete: 46,
                up: 38,
                left: 37,
                right: 39,
                down: 40,
                escape: 27
            };

            var code = keyCodes[key] ? keyCodes[key] : parseInt(key, 10);
            return function keyFilterHandler (event: KeyboardEvent): any {
                if (event.keyCode === code) {
                    return callback.apply(this, arguments);
                }
            };
        },

        /** Calls a function */
        invoke: function invokeFilter (
            callback: (...args: any[]) => any,
            ...args: any[]
        ): any {
            return callback.apply(null, args);
        },

        /** Returns a function that sets a value on an object */
        set: function setFilter ( obj: any, key: any, value: any ): any {
            return function setFilterHandler() {
                obj[key] = value;
            };
        }
    };

}

