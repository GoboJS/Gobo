/// <reference path="wildcard.ts"/>
/// <reference path="watchchain.ts"/>
/// <reference path="directives.ts"/>
/// <reference path="traverse.ts"/>
/// <reference path="parse.ts"/>


/** A parsed expression */
class Expression {

    /** The path of keys to fetch when resolving values */
    public keypath: string[]

    constructor( expr: string ) {
        this.keypath = expr.split(".");
    }

    /** Returns the value of this expression */
    resolve ( data: Data ): any {
        var value = data.get( this.keypath );
        return typeof value === 'function' ? value() : value;
    }
}


/** Data being bound to the html */
class Data {

    /**
     * Returns the root object on which a given key exists. Note that this
     * isn't the value of that key, but where to find the key
     */
    getRoot: ( key: string ) => any;

    /** Applies a callback to each object/key in a chain */
    eachKey (
        keypath: string[],
        callback: (obj: any, key: string) => void
    ): void {
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
        return new ScopedData(this, key, value);
    }
}

/** The root lookup table for data */
class RootData implements Data {

    constructor( private data: any ) {}

    /** @inheritdoc Data#getRoot */
    getRoot ( key: string ): any {
        return this.data;
    }

    /** @inheritdoc Data#eachKey */
    eachKey: (
        keypath: string[],
        callback: (obj: any, key: string) => void
    ) => void;

    /** @inheritdoc Data#get */
    get: ( keypath: string[] ) => any;

    /** @inheritdoc Data#scope */
    scope: ( key: string, value: any ) => Data;
}

/** Creates a new data scope with a specific key and value */
class ScopedData implements Data {

    constructor(
        private parent: Data,
        private key: string,
        private value: any
    ) {}

    /** @inheritdoc Data#getRoot */
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

    /** @inheritdoc Data#eachKey */
    eachKey: (
        keypath: string[],
        callback: (obj: any, key: string) => void
    ) => void;

    /** @inheritdoc Data#get */
    get: ( keypath: string[] ) => any;

    /** @inheritdoc Data#scope */
    scope: ( key: string, value: any ) => Data;
}

// Apply the default data implementations to the child classes
Object.getOwnPropertyNames(Data.prototype).forEach(name => {
    RootData.prototype[name] = Data.prototype[name];
    ScopedData.prototype[name] = Data.prototype[name];
});


/** An interface into the gobo configuration */
class Config {

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** The start of each directive */
    public prefix: string;

    /** A lookup for resolving directives */
    public getDirective:
        (string) => Wildcard.Tuple<Directives.DirectiveBuilder>;

    /** Constructor */
    constructor ( gobo: Gobo ) {
        this.watch = gobo.watch;
        this.prefix = gobo.prefix;
        this.getDirective = Wildcard.createLookup(gobo.directives);
    }

    /** Strips the prefix off of a string */
    stripPrefix ( str: string ): string {
        return str.substr( this.prefix.length );
    }

}

/** The options that can be passed to Gobo on instantiation */
interface Options {

    /** The observation module to use for watching values */
    watch: Watch.Watch;
}

/** Configures the view */
class Gobo {

    /** The start of each directive */
    public prefix: string = 'g-';

    /** The default directives */
    public directives: { [key: string]: Directives.DirectiveBuilder }
        = new Directives.DefaultDirectives();

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** A helper for building simple directives */
    static oneway = Directives.oneway;

    /** Constructor */
    constructor ( options: Options ) {
        this.watch = options.watch;
    }

    /** Attaches this configuration to a DOM element */
    bind ( root: HTMLElement, data: any ): void {
        var config = new Config(this);
        var section = Parse.parse(
            Traverse.search(config, root), config, new RootData(data) );
        section.initialize();
        section.connect();
    }
}


