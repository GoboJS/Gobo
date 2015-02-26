/// <reference path="data.ts"/>

module Expr {

    /** A filter that can be applied to an expression */
    export type Filter = (value: any) => any;

    /** Creates a function that splits a string */
    function splitter( regex: RegExp ): (input: string) => string[] {
        return (input) => {
            return input.match(regex);
        };
    }

    // Splits a string by unquoted characters
    // @see http://stackoverflow.com/questions/9609973
    var split = {
        '.': splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\.])+/g),
        '|': splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\|])+/g)
    };

    /** Strips quotes from the values in an array of string */
    function stripQuotes( values: string[] ) {
        return values.map(value => {
            var char0 = value.charAt(0);
            if (
                (char0 === "'" || char0 === '"') &&
                char0 === value.charAt(value.length - 1)
            ) {
                return value.substr(1, value.length - 2);
            }
            else {
                return value;
            }
        });
    }


    /** A parsed expression */
    export class Expression {

        /** The path of keys to fetch when resolving values */
        public keypath: string[]

        /** Filters to apply */
        public filters: Filter[]

        constructor( expr: string, config: Config ) {
            var parts = split['|'](expr);
            this.keypath = stripQuotes( split['.'](parts.shift().trim()) );

            this.filters = parts.map(filter => {
                filter = filter.trim();
                if ( !config.filters[filter] ) {
                    throw new Error("Filter does not exist: '" + filter + '"');
                }
                return config.filters[filter];
            });
        }

        /** Returns the value of this expression */
        resolve ( data: Data.Data ): any {
            var value = this.filters.reduce(
                (value, filter) => { return filter(value); },
                data.get(this.keypath)
            );

            return typeof value === 'function' ? value() : value;
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
