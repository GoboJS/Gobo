/// <reference path="data.ts"/>
/// <reference path="filters.ts"/>

module Expr {

    /** Creates a function that splits a string */
    function splitter( regex: RegExp ): (input: string) => string[] {
        return (input) => {
            var split = (input || "").match(regex);
            return split ? split.map(str => { return str.trim(); }) : [];
        };
    }

    // Splits a string by unquoted characters
    // @see http://stackoverflow.com/questions/9609973
    var split = {
        ".": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\.])+/g),
        "|": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\|])+/g),
        " ": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^ ])+/g),
        "<": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^<])+/g),
        ">": splitter(/(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^>])+/g)
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

        /** Any arguments to be passed to this value if it is a function */
        private args: Value[];

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
                case undefined:
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
                        var parts = split[" "](token);
                        this.value = parseKeypath( parts.shift() );
                        if ( parts.length > 0 ) {
                            this.args = parts.map(part => {
                                return new Value(part);
                            });
                        }
                    }
            }
        }

        /** Interpret and return the value */
        interpret ( get: (keypath: Data.Keypath) => any ): any {
            // Since there is no syntax for writing out arrays, we can use the
            // fact that value is an array as an indication that it was parsed
            // as a keypath
            if ( !Array.isArray(this.value) ) {
                return this.value;
            }

            var value = get(<Data.Keypath> this.value);

            // If it isn't a function, or there aren't any arguments that
            // need to be applied, just return it
            if ( !this.args || typeof value !== "function" ) {
                return value;
            }

            // Otherwise, return a function that will interpret the predefined
            // arguments and combine them with any passed in args
            var args = this.args;
            return function prependArgs ( ...passed: any[] ): any {
                var resolved = args.map(arg => { return arg.interpret(get); });
                return value.apply( null, resolved.concat(passed) );
            };
        }

        /** Adds any keypaths referenced by this value to an array */
        addKeypaths( keypaths: Data.Keypath[] ): void {
            // By actually interpretting the argument, we weed out the list
            // of primitives from actual keypath references. Then, we hijack
            // the call to get
            var add = keypaths.push.bind(keypaths);

            this.interpret(add);

            if ( this.args ) {
                this.args.forEach(arg => { arg.interpret(add); });
            }
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
        ): any {
            if (fn) {
                var args = this.args.map(arg => {
                    return arg.interpret( data.get.bind(data) );
                });
                args.unshift(value);
                return fn.apply(this.bind, args);
            }
            else {
                return value;
            }
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
            var add = keypaths.push.bind(keypaths);
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

        /** The value to fetch when resolving an expression */
        private value: Value;

        /** The value to which changes are published */
        private publish: Value;

        /** A list of paths to monitor */
        public watches: Data.Keypath[] = [];

        /** Filters to apply */
        public filters: FilterCall[];

        /** @constructor */
        constructor( expr: string, config: Config.Config ) {
            var watchParts = split["<"](expr || "");

            var filterParts = split["|"](watchParts.shift());

            var publishParts = split[">"](filterParts.shift());

            this.value = new Value(publishParts.shift());

            if ( publishParts.length === 0 ) {
                this.publish = this.value;
            }
            else if ( publishParts.length === 1 ) {
                this.publish = new Value(publishParts[0]);
            }
            else {
                throw new Error("Cant publish to multiple places: " + expr);
            }

            this.value.addKeypaths( this.watches );

            watchParts.map(token => {
                this.watches.push( parseKeypath(token) );
            });

            this.filters = filterParts.map(filterExpr => {
                var filter = parseFilter(filterExpr, config);
                filter.addKeypaths( this.watches );
                return filter;
            });
        }

        /** Returns the value of this expression */
        resolve ( data: Data.Data, allowFuncs: boolean ): any {
            var value = this.filters.reduce(
                (value, filter) => { return filter.read(data, value); },
                this.value.interpret( data.get.bind(data) )
            );

            if ( !allowFuncs && typeof value === "function" ) {
                value = value();
            }

            return value;
        }

        /** Sets a value of this expression */
        set ( data: Data.Data, value: any ): void {

            // Walk backwards through the filters and apply them
            for ( var i = this.filters.length - 1; i >= 0; i-- ) {
                value = this.filters[i].publish(data, value);
            }

            var setter = this.publish.interpret(keypath => {

                var obj = data.get( keypath.slice(0, -1), keypath[0] );
                var key = keypath[keypath.length - 1];

                // By returning a function, it gets passed through the binding
                // logic of Expression.interpret, which hooks in any extra
                // arguments and attaches the correct 'this' value
                return function setter ( ...args: any[] ) {
                    if ( typeof obj[key] === "function" ) {
                        obj[key].apply( obj, args );
                    }
                    else {
                        obj[key] = value;
                    }
                };
            });

            if ( typeof setter === "function" ) {
                setter(value);
            }
        }
    }

}

