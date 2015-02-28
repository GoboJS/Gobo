/// <reference path="data.ts"/>

module Expr {

    /** A filter that can be applied to an expression */
    export type Filter = (value: any, ...args: any[]) => any;

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
        " ": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^ ])+/g)
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
    type FilterCall = (data: Data.Data, value: any) => any;

    /** Parses a filter expression */
    function parseFilter( expr: string, config: Config ): FilterCall {
        var tokens = split[" "](expr);

        var filterName = tokens.shift().trim();
        if ( !config.filters[filterName] ) {
            throw new Error("Filter does not exist: '" + filterName + "'");
        }
        var filter = config.filters[filterName];

        return function applyFilter(data: Data.Data, value: any): any {
            var args = tokens.map((token) => {
                return interpret(data, token);
            });
            args.unshift(value);
            return filter.apply(null, args);
        };
    }


    /** A parsed expression */
    export class Expression {

        /** The path of keys to fetch when resolving values */
        public keypath: string[]

        /** Arguments to pass */
        public args: string[];

        /** Filters to apply */
        public filters: FilterCall[]

        constructor( expr: string, config: Config ) {
            var filterParts = split["|"](expr);

            this.args = split[" "](filterParts.shift());
            this.keypath = stripQuotes( split["."](this.args.shift().trim()) );

            this.filters = filterParts.map(filterExpr => {
                return parseFilter(filterExpr, config);
            });
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
                (value, filter) => { return filter(data, value); },
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


    /** Creates a filter */
    export function filter( src: Filter ): Filter {
        return src;
    }

    /** Default list of directives */
    export class DefaultFilters {
        [key: string]: Filter;
    }

    DefaultFilters.prototype = {

        /** Invert a value */
        limit: filter(function limit (
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
        }),

        /** Invert a value */
        not: filter((value: any): boolean => {
            return !value;
        }),

        /** Convert a value to uppercase */
        uppercase: filter((str: string): string => {
            return str ? str.toUpperCase() : "";
        }),

        /** Convert a value to lowercase */
        lowercase: filter((str: string): string => {
            return str ? str.toLowerCase() : "";
        })
    };

}
