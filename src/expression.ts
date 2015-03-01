/// <reference path="data.ts"/>

module Expr {

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


    /** Creates a function that splits a string */
    function splitter( regex: RegExp ): (input: string) => string[] {
        return (input) => {
            return input.match(regex);
        };
    }

    // Splits a string by unquoted characters
    // @see http://stackoverflow.com/questions/9609973
    var split = {
        ".": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\.])+/g),
        "|": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\|])+/g),
        " ": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^ ])+/g),
        "<": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^<])+/g)
    };

    /** Returns whether a value appears to contain quotes */
    function isQuoted(value: string): boolean {
        var char0 = value.charAt(0);
        return (char0 === "'" || char0 === "\"") &&
            char0 === value.charAt(value.length - 1);
    }

    /** Strips quotes from the values in an array of string */
    function stripQuotes( values: string[] ) {
        return values.map(value => {
            return isQuoted(value) ? value.substr(1, value.length - 2) : value;
        });
    }

    /** Given a token from an expression, interprets it */
    function interpret ( data: Data.Data, token: string ): any {
        switch (token) {
            case "true":
                return true;
            case "false":
                return false;
            case "null":
                return null;
            case "undefined":
                return undefined;
            default:
                if ( isQuoted(token) ) {
                    return token.substr(1, token.length - 2);
                }
                else if (!isNaN(parseFloat(token)) && isFinite(<any> token)) {
                    return parseFloat(token);
                }
                else {
                    return data.get( split["."](token) );
                }
        }
    }

    /** A call to a filter */
    class FilterCall {

        /** The value to bind this filter to when calling */
        private bind: any = {};

        constructor( private filter: Filter, private args: string[] ) {}

        /** Calculates the arguments for this filter call */
        private invoke(fn: FilterFunc, value: any, data: Data.Data): any[] {
            var args = this.args.map((token) => {
                return interpret(data, token);
            });
            args.unshift(value);
            return fn.apply(this.bind, args);
        }

        /** Applies this filter when applying a value to a directive */
        read( data: Data.Data, value: any ): any {
            var filter = typeof this.filter === "function" ?
                <FilterFunc> this.filter :
                (<FilterObj> this.filter).read;

            return this.invoke(filter, value, data);
        }

        /** Applies this filter when applying a value to a directive */
        publish( data: Data.Data, value: any ): any {
            // Don't apply simple filters on the publish step
            return typeof this.filter === "function" ?
                value :
                this.invoke((<FilterObj>this.filter).publish, value, data);
        }
    }

    /** Parses a filter expression */
    function parseFilter( expr: string, config: Config ): FilterCall {
        var tokens = split[" "](expr);

        var filterName = tokens.shift().trim();
        if ( !config.filters[filterName] ) {
            throw new Error("Filter does not exist: '" + filterName + "'");
        }

        return new FilterCall( config.filters[filterName], tokens );
    }


    /** A parsed expression */
    export class Expression {

        /** The path of keys to fetch when resolving values */
        public keypath: string[];

        /** The path to monitor for changes */
        public watch: string[];

        /** Arguments to pass */
        public args: string[];

        /** Filters to apply */
        public filters: FilterCall[];

        constructor( expr: string, config: Config ) {
            var watchParts = split["<"](expr);

            var filterParts = split["|"](watchParts.shift());

            this.args = split[" "](filterParts.shift());
            this.keypath = stripQuotes( split["."](this.args.shift().trim()) );

            this.filters = filterParts.map(filterExpr => {
                return parseFilter(filterExpr, config);
            });

            if ( watchParts.length === 1 ) {
                this.watch = stripQuotes(split["."](watchParts.shift().trim()));
            }
            else if ( watchParts.length === 0 ) {
                this.watch = this.keypath;
            }
            else {
                throw new Error("Multiple watches in expression: " + expr);
            }
        }

        /** Creates a function that applies the arguments in this expression */
        private applyArgs(
            data: Data.Data,
            value: (...values: any[]) => void
        ): (...values: any[]) => void {

            if ( this.args.length === 0 ) {
                return value;
            }

            return () => {
                var args = [].slice.call(arguments);
                var exprArgs = this.args.map(token => {
                    return interpret(data, token);
                });
                return value.apply(null, exprArgs.concat(args));
            };
        }

        /** Returns the value of this expression */
        resolve ( data: Data.Data, allowFuncs: boolean ): any {
            var value = this.filters.reduce(
                (value, filter) => { return filter.read(data, value); },
                data.get(this.keypath)
            );

            if ( typeof value === "function" ) {
                value = this.applyArgs(data, value);
                if ( !allowFuncs ) {
                    value = value();
                }
            }

            return value;
        }

        /** Sets a value of this expression */
        set ( data: Data.Data, value: any ): void {

            // Walk backwards through the filters and apply any
            for ( var i = this.filters.length - 1; i >= 0; i-- ) {
                value = this.filters[i].publish(data, value);
            }

            var obj = data.get(
                this.keypath.slice(0, this.keypath.length - 1),
                this.keypath[0]
            );

            var key = this.keypath[this.keypath.length - 1];

            if ( typeof obj[key] === "function" ) {
                this.applyArgs( data, obj[key] )( value );
            }
            else {
                obj[key] = value;
            }
        }
    }


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
