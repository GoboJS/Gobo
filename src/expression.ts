/// <reference path="data.ts"/>
/// <reference path="filters.ts"/>

module Expr {

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
    function stripQuotes( values: string[] ): string[] {
        return values.map(value => {
            return isQuoted(value) ? value.substr(1, value.length - 2) : value;
        });
    }

    /** Parses a keypath */
    export function parseKeypath ( expr: string ): Data.Keypath {
        return stripQuotes( split["."]( expr.trim() ) );
    }

    /** Given a token from an expression, interprets it */
    function interpret (
        data: { get (keypath: Data.Keypath): any; },
        token: string
    ): any {
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
                    return data.get( parseKeypath(token) );
                }
        }
    }

    /** A call to a filter */
    class FilterCall {

        /** The value to bind this filter to when calling */
        private bind: any = {};

        /** @constructor */
        constructor(private filter: Filters.Filter, private args: string[]) {}

        /** Calculates the arguments for this filter call */
        private invoke(
            fn: Filters.FilterFunc,
            value: any,
            data: Data.Data
        ): any[] {
            var args = this.args.map((token) => {
                return interpret(data, token);
            });
            args.unshift(value);
            return fn.apply(this.bind, args);
        }

        /** Applies this filter when applying a value to a directive */
        read( data: Data.Data, value: any ): any {
            var filter = typeof this.filter === "function" ?
                <Filters.FilterFunc> this.filter :
                (<Filters.FilterObj> this.filter).read;

            return this.invoke(filter, value, data);
        }

        /** Applies this filter when applying a value to a directive */
        publish( data: Data.Data, value: any ): any {
            // Don't apply simple filters on the publish step
            if ( typeof this.filter === "function" ) {
                return value;
            }
            else {
                return this.invoke(
                    (<Filters.FilterObj>this.filter).publish,
                    value,
                    data
                );
            }
        }

        /** Adds any keypaths referenced by this filter to an array */
        addKeypaths( keypaths: Data.Keypath[] ): void {
            // By actually interpretting the argument, we weed out the list
            // of primitives from actual keypath references. Then, we hijack
            // the call to get
            this.args.forEach(interpret.bind(null, {
                get: (keypath) => { keypaths.push(keypath); }
            }));
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
        public keypath: Data.Keypath;

        /** A list of paths to monitor */
        public watches: Data.Keypath[];

        /** Arguments to pass */
        public args: string[];

        /** Filters to apply */
        public filters: FilterCall[];

        /** @constructor */
        constructor( expr: string, config: Config ) {
            var watchParts = split["<"](expr);

            var filterParts = split["|"](watchParts.shift());

            this.args = split[" "](filterParts.shift());
            this.keypath = parseKeypath( this.args.shift() );

            if ( watchParts.length > 0 ) {
                this.watches = watchParts.map(token => {
                    return parseKeypath(token);
                });
            }
            else {
                this.watches = [ this.keypath ];
            }

            this.filters = filterParts.map(filterExpr => {
                var filter = parseFilter(filterExpr, config);
                filter.addKeypaths( this.watches );
                return filter;
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


}
