/// <reference path="browser.d.ts"/>
/// <reference path="wildcard.ts"/>

/** Convert a value to a string */
function asString ( value: any ): string {
    return value === undefined || value === null ? "" : String(value);
}

/** A parsed expression */
class Expression {
    constructor( public expr: string ) {}
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
                    directive.execute(elem, asString(data.get(expr)));
                }
            });

        }, this);
    }
}

/** Data being bound to the html */
class Data {
    constructor( private data: any = {} ) {}

    /** Returns the value of an expression */
    get ( expr: Expression ): any {
        return this.data[expr.expr];
    }
}

/** An interface into the gobo configuration */
class Config {

    /** The start of each directive */
    public prefix: string;

    /** A lookup for resolving directives */
    public getDirective: (string) => Directive;

    /** Constructor */
    constructor ( gobo: Gobo ) {
        this.prefix = gobo.prefix;
        this.getDirective = Wildcard.createLookup(gobo.directives);
    }

    /** Strips the prefix off of a string */
    stripPrefix ( str: string ): string {
        return str.substr( this.prefix.length );
    }

    /** Invokes a callback for each element with a directive */
    eachDirectedElem(root: Node, callback: (Node) => void, that: any) {
        var elems = document.evaluate(
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

/** Configures the view */
class Gobo {

    /** The start of each directive */
    public prefix: string = 'g-';

    /** The start of each directive */
    public directives: { [key: string]: Directive } = new DefaultDirectives();

    /** Attaches this configuration to a DOM element */
    bind ( root: Node, data: any ): void {
        new Subsection( root, new Config(this), new Data(data) );
    }
}


