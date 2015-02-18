/// <reference path="wildcard.ts"/>
/// <reference path="watchchain.ts"/>
/// <reference path="directives.ts"/>
/// <reference path="traverse.ts"/>
/// <reference path="block.ts"/>
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

    constructor( private data: any = {} ) {}

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
        }, this.data);
    }

    /** Returns the value given a path of keys */
    get ( keypath: string[] ): any {
        return keypath.reduce((obj, key) => {
            if ( obj !== null && obj !== undefined ) {
                return obj[key];
            }
        }, this.data);
    }
}

/** An interface into the gobo configuration */
class Config {

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** The start of each directive */
    public prefix: string;

    /** A lookup for resolving directives */
    public getDirective: (string) => Directives.DirectiveBuilder;

    /** A lookup for resolving blocks */
    public getBlock: (string) => Block.BlockBuilder;

    /** Constructor */
    constructor ( gobo: Gobo ) {
        this.watch = gobo.watch;
        this.prefix = gobo.prefix;
        this.getDirective = Wildcard.createLookup(gobo.directives);
        this.getBlock = Wildcard.createLookup(gobo.blocks);
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

    /** The default blocks */
    public blocks: { [key: string]: Block.BlockBuilder }
        = new Block.DefaultBlocks();

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** Constructor */
    constructor ( options: Options ) {
        this.watch = options.watch;
    }

    /** Attaches this configuration to a DOM element */
    bind ( root: Node, data: any ): void {
        Parse.parse(
            Traverse.Reader.search(this.prefix, root),
            new Config(this),
            new Data(data)
        ).connect();
    }
}


