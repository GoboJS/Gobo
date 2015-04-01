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

    /** The callback for setting up watch bindings on an expression */
    export type WatchCallback =
        ( getRoot: () => any, keypath: Data.Keypath ) => void;

    /** Read a keypath from a root object */
    function readKeypath ( root: any, keypath: Keypath ): any {

        // While walking through the keypath below, we keep track of
        // the trailing object so we can guarantee functions are always
        // bound to their parent object
        var binding;

        // Walk through each key and extract the nested path
        var value = keypath.reduce((obj, key) => {
            binding = obj;
            if ( obj !== null && obj !== undefined ) {
                return obj[key];
            }
        }, root);

        return typeof value === "function" ? value.bind(binding) : value;
    }

    /** Sets the value of a keypth on an object */
    function setKeypath ( root: any, keypath: Keypath, value: any ): void {
        var obj = keypath.length > 1 ?
            readKeypath( root, keypath.slice(0, -1) ) :
            root;

        var key = keypath[keypath.length - 1];
        obj[key] = value;
    }

    /** Returns a temporary object with the given key set */
    function tempObj ( key: any, value: any ): any {
        var temp = {};
        temp[key] = value;
        return temp;
    }

    /** Implementation of the 'scope' function for the Data objections */
    function scope ( key: string, value: any ): Data {
        return new Scoped(tempObj(key, new Expr.PrimitiveAtom(value)), this);
    }

    /** Data being bound to the html */
    export interface Data {

        /** Executes a function for each binding needed for a keypath */
        eachBinding( keypath: Keypath, callback: WatchCallback ): void;

        /** Returns the value given a path of keys */
        get( keypath: Keypath ): any;

        /** Sets a value for a specific keypath */
        set( keypath: Keypath, value: any ): void;

        /** Creates a new scope from this instance */
        scope ( key: string, value: any ): Data;
    }

    /** The root lookup table for data */
    export class Root implements Data {

        /** @inheritDoc Data#scope */
        public scope = scope;

        /** @constructor */
        constructor( private data: any ) {}

        /** @inheritDoc Data#get */
        get ( keypath: Keypath ): any {
            return readKeypath( this.data, keypath );
        }

        /** @inheritDoc Data#eachBinding */
        eachBinding( keypath: Keypath, callback: WatchCallback ): void {
            callback( () => { return this.data; }, keypath );
        }

        /** @inheritDoc Data#set */
        set ( keypath: Keypath, value: any ): void {
            setKeypath( this.data, keypath, value );
        }
    }

    /** Creates a scope that maps certain keys and denies all other values */
    export class Scoped implements Data {

        /** @inheritDoc Data#scope */
        public scope = scope;

        /** @constructor */
        constructor(
            private mapping: { [key: string]: Expr.Atom; },
            private parent?: Data
        ) {}

        /** @inheritDoc Data#get */
        get ( keypath: Keypath ): any {
            var key = keypath[0];
            if ( this.mapping[key] ) {
                return readKeypath(
                    tempObj(key, this.mapping[key].read()),
                    keypath
                );
            }
            else if ( this.parent ) {
                return this.parent.get(keypath);
            }
        }

        /** @inheritDoc Data#eachBinding */
        eachBinding( keypath: Keypath, callback: WatchCallback ): void {
            var key = keypath[0];

            if ( this.mapping[key] ) {
                callback(
                    () => { return tempObj(key, this.mapping[key].read()); },
                    keypath
                );

                this.mapping[key].eachBinding(callback);
            }
            else if ( this.parent ) {
                this.parent.eachBinding(keypath, callback);
            }
        }

        /** @inheritDoc Data#set */
        set ( keypath: Keypath, value: any ): void {
            var key = keypath[0];

            if ( this.mapping[key] ) {
                if ( keypath.length === 1 ) {
                    this.mapping[key].publish(value);
                }
                else {
                    setKeypath( this.mapping[key].read(), keypath, value );
                }
            }
            else if ( this.parent ) {
                this.parent.set(keypath, value);
            }
        }
    }

}

