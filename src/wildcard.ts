/**
 * A module for looking up a value based on a wildcard key match.
 */
module Wildcard {
    // NOTE: This could more efficiently be implemented with a trie, but that
    // kind of optimization can come later.

    /** A tuple describing a value and the wildcard portion of a string */
    export interface Tuple<T> {

        /** The matched value */
        value: T;

        /** The portion of the key that matched the wildcard */
        tail?: string;
    }

    /** Key value mapping of the input data */
    class KeyValue<T> {

        /** The lookup key */
        public key: string;

        /** Whether this key/value supports a wildcard match */
        public wildcard: boolean;

        /** Constructor */
        constructor( key: string, public value: T ) {
            var star = key.indexOf('*');
            if ( star === -1 ) {
                this.key = key.toLowerCase();
                this.wildcard = false;
            }
            else if ( star - 1 === key.length ) {
                throw new Error(
                    "Wildcard matches are only support at the end of a key");
            }
            else {
                this.key = key.substring(0, star).toLowerCase();
                this.wildcard = true;
            }
        }

        /** Returns a tuple with the result and any extra key info */
        public match ( against: string ): Tuple<T> {
            if ( this.wildcard ) {
                if ( against.indexOf(this.key) === 0 ) {
                    return {
                        value: this.value,
                        tail: against.substr(this.key.length)
                    };
                }
            }
            else if ( this.key === against ) {
                return { value: this.value };
            }
        }
    }

    /** Creates a lookup table from an object */
    export function createLookup<T>(
        obj: { [key: string]: T }
    ): (string) => Tuple<T> {

        var matchers: Array<KeyValue<T>> = [];
        for ( var key in obj ) {
            matchers.push( new KeyValue(key, obj[key]) );
        }

        // Sort in length descending order to match the most specific
        matchers.sort((a, b) => { return b.key.length - a.key.length; });

        return function lookup (key: string): Tuple<T> {
            key = key.toLowerCase();
            for ( var i = 0; i < matchers.length; i++ ) {
                var result = matchers[i].match(key);
                if ( result ) {
                    return result;
                }
            }
        };
    }
}
