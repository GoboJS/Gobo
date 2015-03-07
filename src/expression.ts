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
    function parseKeypath ( expr: string ): Data.Keypath {
        return stripQuotes( split["."]( expr.trim().replace(/^\.+/, "") ) );
    }

    /** Returns whether a string appears to be a number */
    function isNumeric ( str: string ): boolean {
        return !isNaN(parseFloat(str)) && isFinite(<any> str);
    }

    /** A value can be a boolean, null, a string, number or keypath */
    export class Value {

        /** The raw value */
        private value: boolean | Data.Keypath | number | string;

        /** @constructor */
        constructor ( token: any ) {
            switch ( token ) {
                case "true":
                    this.value = true;
                    break;
                case "false":
                    this.value = false;
                    break;
                case "null":
                    this.value = null;
                    break;
                case "undefined":
                    break;
                default:
                    if ( isQuoted(token) ) {
                        this.value = token.substr(1, token.length - 2);
                    }
                    else if ( isNumeric(token) ) {
                        this.value = parseFloat(token);
                    }
                    else {
                        this.value = parseKeypath(token);
                    }
            }
        }

        /** Interpret and return the value */
        interpret (data: { get (keypath: Data.Keypath): any; }): any {
            // Since there is no syntax for writing out arrays, we can use the
            // fact that value is an array as an indication that it was parsed
            // as a keypath
            return Array.isArray(this.value) ?
                data.get(<Data.Keypath> this.value) :
                this.value;
        }
    }

    /** A call to a filter */
    class FilterCall {

        /** The value to bind this filter to when calling */
        private bind: any = {};

        /** @constructor */
        constructor(private filter: Filters.Filter, private args: Value[]) {}

        /** Calculates the arguments for this filter call */
        private invoke(
            fn: Filters.FilterFunc,
            value: any,
            data: Data.Data
        ): any[] {
            var args = this.args.map(arg => { return arg.interpret(data); });
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
            var add = { get: (keypath) => { keypaths.push(keypath); } };
            this.args.forEach(arg => { arg.interpret(add); });
        }
    }

    /** Parses a filter expression */
    function parseFilter( expr: string, config: Config.Config ): FilterCall {
        var tokens = split[" "](expr);

        var filterName = tokens.shift().trim();
        if ( !config.filters[filterName] ) {
            throw new Error("Filter does not exist: '" + filterName + "'");
        }

        return new FilterCall(
            config.filters[filterName],
            tokens.map(token => { return new Value(token); })
        );
    }

    /** A parsed expression */
    export class Expression {

        /** The path of keys to fetch when resolving values */
        public keypath: Data.Keypath;

        /** A list of paths to monitor */
        public watches: Data.Keypath[];

        /** Arguments to pass */
        public args: Value[];

        /** Filters to apply */
        public filters: FilterCall[];

        /** @constructor */
        constructor( expr: string, config: Config.Config ) {
            var watchParts = split["<"](expr);

            var filterParts = split["|"](watchParts.shift());

            var args = split[" "](filterParts.shift());

            this.keypath = parseKeypath( args.shift() );

            this.args = args.map(arg => { return new Value(arg); });

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
                var exprArgs = this.args.map(arg => {
                    return arg.interpret(data);
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
