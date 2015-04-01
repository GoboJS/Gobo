/// <reference path="data.ts"/>
/// <reference path="filters.ts"/>
/// <reference path="watch.ts"/>

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

    /** Reads the values from an array of atoms */
    function readAtoms( atoms: Atom[] ): any[] {
        return atoms.map(atom => { return atom.read(); });
    }

    /**
     * An atom represents a single value in an expression. For example, in
     * the expression 'person.name | substr 5', the following are atoms:
     * - person.name
     * - substr
     * - 5
     */
    export interface Atom {

        /** Interpret and return the value */
        read(): any;

        /** Sets the value of this atom */
        publish( value: any ): void;

        /** Executes a callback for every binding in this expression */
        eachBinding( callback: Data.WatchCallback ): void;
    }

    /** An atom representing a primitive value */
    class PrimitiveAtom implements Atom {
        /** @constructor */
        constructor (
            private value: boolean | number | string | HTMLElement
        ) {}

        /** @inheritDoc Atom#read */
        read (): any {
            return this.value;
        }

        /** @inheritDoc Atom#publish */
        publish( value: any ): void {
            // Empty because you can't set the value of a primitive
        }

        /** @inheritDoc Atom#eachBinding */
        eachBinding( callback: Data.WatchCallback ): void {
            // Empty because you can't bind to a static value
        }
    }

    /** An atom representing a keypath */
    class KeypathAtom implements Atom {
        /** @constructor */
        constructor (
            private data: Data.Data,
            private keypath: Data.Keypath,
            private args?: Atom[]
        ) {}

        /** @inheritDoc Atom#read */
        read (): any {
            var value = this.data.get( this.keypath );

            if ( !this.args || typeof value !== "function" ) {
                return value;
            }

            var args = this.args;
            return function prependArgs ( ...passed: any[] ): any {
                return value.apply(null, readAtoms(args).concat(passed));
            };
        }

        /** @inheritDoc Atom#publish */
        publish( value: any ): void {
            var existing = this.read();
            if ( typeof existing === "function" ) {
                existing(value);
            }
            else {
                this.data.set( this.keypath, value );
            }
        }

        /** @inheritDoc Atom#eachBinding */
        eachBinding( callback: Data.WatchCallback ): void {
            this.data.eachBinding( this.keypath, callback );
        }
    }

    /** Reads from one atom, publishes to another */
    class PublishAtom implements Atom {
        /** @constructor */
        constructor ( private reader: Atom, private publisher: Atom ) {}

        /** @inheritDoc Atom#read */
        read (): any {
            return this.reader.read();
        }

        /** @inheritDoc Atom#publish */
        publish( value: any ): void {
            this.publisher.publish(value);
        }

        /** @inheritDoc Atom#eachBinding */
        eachBinding( callback: Data.WatchCallback ): void {
            this.reader.eachBinding(callback);
        }
    }

    /** A call to a filter */
    class FilterAtom implements Atom {

        /** The value to bind this filter to when calling */
        private bind: any = {};

        /** @constructor */
        constructor(
            private inner: Atom,
            private filter: Filters.Filter,
            private args: Atom[]
        ) {}

        /** Invokes the read or publish function for this filter */
        private invoke(
            fn: (...args: any[]) => any,
            value: any
        ): any {
            if (!fn) {
                return value;
            }

            var args = readAtoms(this.args);
            args.unshift(value);
            return fn.apply(this.bind, args);
        }

        /** @inheritDoc Atom#read */
        read (): any {
            var filter = typeof this.filter === "function" ?
                <Filters.FilterFunc> this.filter :
                (<Filters.FilterObj> this.filter).read;

            return this.invoke( filter, this.inner.read() );
        }

        /** @inheritDoc Atom#publish */
        publish( value: any ): void {
            // Don't apply simple filters on the publish step
            this.inner.publish(
                typeof this.filter === "function" ?
                    value :
                    this.invoke(
                        (<Filters.FilterObj>this.filter).publish,
                        value
                    )
            );
        }

        /** @inheritDoc Atom#eachBinding */
        eachBinding( callback: Data.WatchCallback ): void {
            this.inner.eachBinding(callback);
            this.args.forEach(arg => { arg.eachBinding(callback); });
        }
    }

    /** A watch atom adds additional watches */
    class WatchAtom implements Atom {
        /** @constructor */
        constructor(
            private inner: Atom,
            private watches: Atom[]
        ) {}

        /** @inheritDoc Atom#read */
        read (): any {
            return this.inner.read();
        }

        /** @inheritDoc Atom#publish */
        publish( value: any ): void {
            return this.inner.publish(value);
        }

        /** @inheritDoc Atom#eachBinding */
        eachBinding( callback: Data.WatchCallback ): void {
            this.inner.eachBinding(callback);
            this.watches.forEach(watch => {
                watch.eachBinding(callback);
            });
        }
    }

    /** Makes sure a value is an atom */
    export function asAtom( obj: any ): Atom {
        if ( obj.read && obj.publish && obj.eachBinding ) {
            return obj;
        }
        else {
            return new PrimitiveAtom(obj);
        }
    }


    /** A mapping of keywords to their values */
    var keywords = {
        "true": true,
        "false": false,
        "null": null,
        "undefined": undefined
    };

    /** Parses the various parts of an expression */
    export class Parser {

        /**
         * @constructor
         * @param config Overall app config
         * @param data The context from which to pull keypaths
         * @param elem The element to use if they reference the '$elem' keyword
         */
        constructor(
            private config: Config.Config,
            private data: Data.Data,
            private elem: HTMLElement
        ) {}

        /** Parses an atom from a string */
        private parseAtom( token: string, args?: Atom[] ): Atom {

            if ( keywords.hasOwnProperty(token) ) {
                return new PrimitiveAtom( keywords[token] );
            }
            else if ( token === undefined ) {
                return new PrimitiveAtom( undefined );
            }
            else if ( token === "$elem" ) {
                return new PrimitiveAtom( this.elem );
            }
            else if ( isQuoted(token) ) {
                return new PrimitiveAtom( token.substr(1, token.length - 2) );
            }
            else if ( isNumeric(token) ) {
                return new PrimitiveAtom( parseFloat(token) );
            }
            else {
                return new KeypathAtom( this.data, parseKeypath(token), args );
            }
        }

        /**
         * Parses a list of atoms
         * @param tokens The list of expressions to parse
         */
        private parseAtomList( exprs: string[] ): Atom[] {
            return exprs.map(expr => {
                return this.parseAtom(expr);
            });
        }

        /**
         * Parses a core expression, which is basically the keypath on which the
         * whole shinding is operating.
         * @param expr The expression to parse
         */
        private parseCore( expr: string ): Atom {
            var tokens = split[" "](expr);
            var primary = tokens.shift();
            return this.parseAtom( primary, this.parseAtomList(tokens) );
        }

        /** Adds watch expressions to another atom */
        private parseWatches( watchExprs: string[], inner: Atom ): Atom {
            if ( watchExprs.length === 0 ) {
                return inner;
            }
            else {
                return new WatchAtom(
                    inner,
                    watchExprs.map(watch => {
                        return new KeypathAtom(
                            this.data,
                            parseKeypath(watch)
                        );
                    })
                );
            }
        }

        /** Splits the publish from the read of an atom if necessary */
        private parsePublisher( publishExpr: string[], inner: Atom ): Atom {
            if ( publishExpr.length === 0 ) {
                return inner;
            }
            else if ( publishExpr.length === 1 ) {
                return new PublishAtom(
                    inner,
                    this.parseCore(publishExpr[0])
                );
            }
            else {
                throw new Error("Cant publish to multiple places");
            }
        }

        /**
         * Parses a filter expression
         * @param core The atom to read from and publish to
         * @param filters The list of filter expressions to parse
         */
        private parseFilters( exprs: string[], core: Atom ): Atom {
            return exprs.reduce((inner: Atom, expr: string) => {

                var tokens = split[" "](expr);

                var filterName = tokens.shift().trim();
                if ( !this.config.filters[filterName] ) {
                    throw new Error(
                        "Filter does not exist: '" + filterName + "'"
                    );
                }

                return new FilterAtom(
                    inner,
                    this.config.filters[filterName],
                    this.parseAtomList(tokens)
                );
            }, core);
        }

        /** Parses a full expression */
        public parse( expr: string ): Atom {
            // Basic expression syntax:
            // CORE ARG > PUBLISH | FILTER ARG | FILTER ARG < WATCH < WATCH

            var watchExprs = split["<"](expr || "");

            var filterExprs = split["|"](watchExprs.shift());

            var publishExpr = split[">"](filterExprs.shift());

            var coreExpr = publishExpr.shift();

            return this.parseWatches(
                watchExprs,
                this.parseFilters(
                    filterExprs,
                    this.parsePublisher(
                        publishExpr,
                        this.parseCore( coreExpr )
                    )
                )
            );
        }
    }

}

