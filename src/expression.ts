/// <reference path="data.ts"/>

module Expr {

    /** A parsed expression */
    export class Expression {

        /** The path of keys to fetch when resolving values */
        public keypath: string[]

        constructor( expr: string ) {
            this.keypath = expr.split(".");
        }

        /** Returns the value of this expression */
        resolve ( data: Data.Data ): any {
            var value = data.get( this.keypath );
            return typeof value === 'function' ? value() : value;
        }
    }

}
