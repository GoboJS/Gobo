/// <reference path="browser.d.ts"/>
/// <reference path="wildcard.ts"/>

/** A mechanism for observing a value on an object */
interface Watch {

    /** Sets up a watch on a key */
    watch( obj: any, key: string, callback: () => void, depth: number ): void;
}

/** A parsed expression */
class Expression {

    /** The path of keys to fetch when resolving values */
    public keypath: string[]

    constructor( expr: string ) {
        this.keypath = expr.split(".");
    }

    /** Returns the value of this expression */
    resolve ( data: Data ): string {
        var value = data.get( this.keypath );

        if ( typeof value === 'function' ) {
            return value();
        }
        else if (value === undefined || value === null) {
            return "";
        }
        else {
            return String(value);
        }
    }
}

/** A subsection of the view */
class Subsection {

    constructor( root: Node, config: Config, data: Data ) {

        config.eachDirectedElem(root, (elem: Element) => {

            config.getDirectives(elem).forEach((attr: Attr) => {

                var directive = config.getDirective(
                    config.stripPrefix(attr.name)
                );

                if ( directive ) {
                    var expr = new Expression(attr.value);
                    function hookup() {
                        directive.execute(elem, expr.resolve(data));
                        data.watch( expr.keypath, config.watch, hookup);
                    }
                    hookup();
                }
            });

        }, this);
    }
}

/** Data being bound to the html */
class Data {
    constructor( private data: any = {} ) {}

    /** Returns the value given a path of keys */
    get ( keypath: string[] ): any {
        return keypath.reduce((obj, key) => {
            if ( obj !== null && obj !== undefined ) {
                return obj[key];
            }
        }, this.data);
    }

    /** Sets up observation for a specific keypath */
    watch( keypath: string[], watch: Watch, fn: () => void ): void {
        if ( watch ) {
            keypath.reduce((obj, key) => {
                if ( obj !== null && obj !== undefined ) {
                    watch.watch(obj, key, fn, 0);
                    return obj[key];
                }
            }, this.data);
        }
    }
}

/** An interface into the gobo configuration */
class Config {

    /** The document being operated on */
    public document: Document;

    /** The observation module to use for watching values */
    public watch: Watch;

    /** The start of each directive */
    public prefix: string;

    /** A lookup for resolving directives */
    public getDirective: (string) => Directive;

    /** Constructor */
    constructor ( gobo: Gobo ) {
        this.document = gobo.document;
        this.watch = gobo.watch;
        this.prefix = gobo.prefix;
        this.getDirective = Wildcard.createLookup(gobo.directives);
    }

    /** Strips the prefix off of a string */
    stripPrefix ( str: string ): string {
        return str.substr( this.prefix.length );
    }

    /** Invokes a callback for each element with a directive */
    eachDirectedElem(root: Node, callback: (Node) => void, that: any) {
        var elems = this.document.evaluate(
            ".//*[@*[starts-with(name(), '" + this.prefix + "')]]",
            root, null, 0, null
        );

        var nodes = [];
        for (var i = elems.iterateNext(); i; i = elems.iterateNext() ) {
            // We need to accumulate the results before using them, otherwise
            // XPath will complain that the DOM was modified before finishing
            // the XPath iteration
            nodes.push(i);
        }

        nodes.forEach(callback, that);
    }

    /** Returns an array of directives attached to an element */
    getDirectives( elem: Element ): Attr[] {
        return [].filter.call( elem.attributes, (attr: Attr) => {
            return attr.name.indexOf(this.prefix) === 0;
        }, this);
    }
}


/** Defines how a directive interacts with an element */
interface Directive {

    /** Executes this directive against an element with a value */
    execute ( elem: Element, value: string ): void;
}

/** Creates a one-way directive from a function */
function oneway ( fn: (elem: Element, value: string) => void ): Directive {
    return { execute: fn };
}

/** Default list of directives */
class DefaultDirectives {
    [key: string]: Directive;

    /** Sets the text content of an element */
    public text: Directive = oneway((elem, value) => {
        elem.textContent = value;
    });
}


/** The options that can be passed to Gobo on instantiation */
interface Options {

    /** The document being operated on */
    document?: Document;

    /** The observation module to use for watching values */
    watch: Watch;
}

/** Configures the view */
class Gobo {

    /** The document to operate on */
    public document: Document;

    /** The start of each directive */
    public prefix: string = 'g-';

    /** The start of each directive */
    public directives: { [key: string]: Directive } = new DefaultDirectives();

    /** The observation module to use for watching values */
    public watch: Watch;

    constructor ( options: Options ) {
        this.document = options.document || window.document;
        this.watch = options.watch;
    }

    /** Attaches this configuration to a DOM element */
    bind ( root: Node, data: any ): void {
        new Subsection( root, new Config(this), new Data(data) );
    }
}


