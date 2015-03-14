module Data {

    /**
     * A list of keys describing the path to a value. This is really a phantom
     * type. In actuality, this is implemented as an array.
     */
    export interface Keypath {
        [index: number]: string;
        length: number;
        concat( other: Keypath ): Keypath;
        slice( start: number, end?: number ): Keypath;
        reduce<T>( callback: (accum: T, key: string) => T, initial: T ): T;
    }

    /** The callback used for iterating over the keys of a data chain */
    export type EachKeyCallback = (obj: any, key: string) => void;

    /** Data being bound to the html */
    export class Data {

        /**
         * Returns the root object on which a given key exists. Note that this
         * isn't the value of that key, but where to find the key
         */
        getRoot: ( key: string ) => any;

        /** Applies a callback to each object/key in a chain */
        eachKey ( keypath: Keypath, callback: EachKeyCallback ): void {
            return keypath.reduce((obj, key) => {
                callback(obj, key);
                if ( obj !== null && obj !== undefined ) {
                    return obj[key];
                }
            }, this.getRoot(keypath[0]));
        }

        /** Returns the value given a path of keys */
        get ( keypath: Keypath, rootKey?: string ): any {
            return keypath.reduce((obj, key) => {
                if ( obj !== null && obj !== undefined ) {
                    return obj[key];
                }
            }, this.getRoot(rootKey || keypath[0]));
        }

        /** Creates a new scope from this instance */
        scope ( key: string, value: any ): Data {
            return new Scoped(this, key, value);
        }
    }

    /** The root lookup table for data */
    export class Root implements Data {

        /** @constructor */
        constructor( private data: any ) {}

        /** @inheritDoc Data#getRoot */
        getRoot ( key: string ): any {
            return this.data;
        }

        /** @inheritDoc Data#eachKey */
        eachKey: ( keypath: Keypath, callback: EachKeyCallback ) => void;

        /** @inheritDoc Data#get */
        get: ( keypath: Keypath, rootKey?: string ) => any;

        /** @inheritDoc Data#scope */
        scope: ( key: string, value: any ) => Data;
    }

    /** Creates a new data scope with a specific key and value */
    export class Scoped implements Data {

        /** @constructor */
        constructor(
            private parent: Data,
            private key: string,
            private value: any
        ) {}

        /** @inheritDoc Data#getRoot */
        getRoot ( key: string ): any {
            if ( key === this.key ) {
                var result = {};
                result[key] = this.value;
                return result;
            }
            else {
                return this.parent.getRoot(key);
            }
        }

        /** @inheritDoc Data#eachKey */
        eachKey: ( keypath: Keypath, callback: EachKeyCallback ) => void;

        /** @inheritDoc Data#get */
        get: ( keypath: Keypath, rootKey?: string ) => any;

        /** @inheritDoc Data#scope */
        scope: ( key: string, value: any ) => Data;
    }

    /** Creates a scope that maps certain keys and denies all other values */
    export class Mask implements Data {

        /** @constructor */
        constructor(
            private parent: Data,
            private mapping: { [key: string]: Expr.Value; }
        ) {}

        /** @inheritDoc Data#getRoot */
        getRoot ( key: string ): any {
            return this.parent.getRoot(key);
        }

        /** Resolves a mapped keypath */
        private withKeypath<T> (
            keypath: Keypath,
            fn: (resolved: Keypath) => T
        ): T {
            if ( this.mapping[keypath[0]] ) {
                return <T> this.mapping[keypath[0]].interpret(resolved => {
                    return fn( resolved.concat(keypath.slice(1)) );
                });
            }
        }

        /** @inheritDoc Data#eachKey */
        eachKey ( keypath: Keypath, callback: EachKeyCallback ): void {
            this.withKeypath(keypath, resolved => {
                this.parent.eachKey( resolved, callback );
            });
        }

        /** @inheritDoc Data#get */
        get ( keypath: Keypath, rootKey?: string ): any {
            return this.withKeypath(keypath, resolved => {
                return this.parent.get( resolved );
            });
        }

        /** @inheritDoc Data#scope */
        scope: ( key: string, value: any ) => Data;
    }

    // Apply the default data implementations to the child classes
    Object.getOwnPropertyNames(Data.prototype).forEach(name => {
        Root.prototype[name] = Data.prototype[name];
        Scoped.prototype[name] = Data.prototype[name];

        if (!Mask.prototype[name]) {
            Mask.prototype[name] = Data.prototype[name];
        }
    });

}

