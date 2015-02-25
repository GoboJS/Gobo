/// <reference path="data.ts"/>

module Expr {

    // Splits a string by unquoted characters
    // @see http://stackoverflow.com/questions/9609973
    var split = {
        '.': /(?:(["'])(?:\\.|[^\1])*?\1|\\.|[^\.])+/g
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

        constructor( expr: string ) {
            this.keypath = stripQuotes(expr.match(split['.']));
        }

        /** Returns the value of this expression */
        resolve ( data: Data.Data ): any {
            var value = data.get( this.keypath );
            return typeof value === 'function' ? value() : value;
        }
    }

}
