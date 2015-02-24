/// <reference path="wildcard.ts"/>
/// <reference path="watch.ts"/>
/// <reference path="directives/defaults.ts"/>
/// <reference path="traverse.ts"/>
/// <reference path="parse.ts"/>
/// <reference path="data.ts"/>
/// <reference path="expression.ts"/>


/** An interface into the gobo configuration */
class Config {

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** The start of each directive */
    public prefix: string;

    /** A lookup for resolving directives */
    private getDirectiveByName:
        (string) => Wildcard.Tuple<Directives.DirectiveBuilder>;

    /** Constructor */
    constructor ( gobo: Gobo ) {
        this.watch = gobo.watch;
        this.prefix = gobo.prefix;
        this.getDirectiveByName = Wildcard.createLookup(gobo.directives);
    }

    /** Strips the prefix off of a string */
    getDirective( attr: Attr ): Wildcard.Tuple<Directives.DirectiveBuilder> {
        return this.getDirectiveByName( attr.name.substr(this.prefix.length) );
    }

    /** Returns the priority of a directive */
    getPriority( attr: Attr ): number {
        var tuple = this.getDirective(attr);
        if ( !tuple ) {
            return 0;
        }
        return tuple.value.priority || 0;
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

    /** A helper for creating directives */
    static directive = Directives.directive;

    /** Constructor */
    constructor ( options: Options ) {
        this.watch = options.watch;
    }

    /** Attaches this configuration to a DOM element */
    bind ( root: HTMLElement, data: any ): void {
        var config = new Config(this);
        var section = Parse.parse(
            new Traverse.Reader(
                new Traverse.XPathIterator(config, root),
                root
            ),
            config,
            new Data.Root(data)
        );
        section.initialize();
        section.connect();
    }
}


