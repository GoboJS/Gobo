module Data {

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
        eachKey ( keypath: string[], callback: EachKeyCallback ): void {
            return keypath.reduce((obj, key) => {
                callback(obj, key);
                if ( obj !== null && obj !== undefined ) {
                    return obj[key];
                }
            }, this.getRoot(keypath[0]));
        }

        /** Returns the value given a path of keys */
        get ( keypath: string[] ): any {
            return keypath.reduce((obj, key) => {
                if ( obj !== null && obj !== undefined ) {
                    return obj[key];
                }
            }, this.getRoot(keypath[0]));
        }

        /** Creates a new scope from this instance */
        scope ( key: string, value: any ): Data {
            return new Scoped(this, key, value);
        }
    }

    /** The root lookup table for data */
    export class Root implements Data {

        constructor( private data: any ) {}

        /** @inheritDoc Data#getRoot */
        getRoot ( key: string ): any {
            return this.data;
        }

        /** @inheritDoc Data#eachKey */
        eachKey: ( keypath: string[], callback: EachKeyCallback ) => void;

        /** @inheritDoc Data#get */
        get: ( keypath: string[] ) => any;

        /** @inheritDoc Data#scope */
        scope: ( key: string, value: any ) => Data;
    }

    /** Creates a new data scope with a specific key and value */
    export class Scoped implements Data {

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
        eachKey: ( keypath: string[], callback: EachKeyCallback ) => void;

        /** @inheritDoc Data#get */
        get: ( keypath: string[] ) => any;

        /** @inheritDoc Data#scope */
        scope: ( key: string, value: any ) => Data;
    }

    // Apply the default data implementations to the child classes
    Object.getOwnPropertyNames(Data.prototype).forEach(name => {
        Root.prototype[name] = Data.prototype[name];
        Scoped.prototype[name] = Data.prototype[name];
    });

}

