/// <reference path="wildcard.ts"/>
/// <reference path="watch.ts"/>
/// <reference path="directives/defaults.ts"/>
/// <reference path="traverse.ts"/>
/// <reference path="parse.ts"/>
/// <reference path="data.ts"/>
/// <reference path="expression.ts"/>
/// <reference path="filters.ts"/>
/// <reference path="components.ts"/>
/// <reference path="config.ts"/>

/** The options that can be passed to Gobo on instantiation */
interface Options {

    /** The observation module to use for watching values */
    watch?: Watch.Watch;
}

/** Configures the view */
class Gobo {

    /** The start of each directive */
    public prefix: string = "g-";

    /** The default directives */
    public directives: any = new Directives.DefaultDirectives();

    /** The default filters */
    public filters: any = new Filters.DefaultFilters();

    /** The default components */
    public components: any = {};

    /** The observation module to use for watching values */
    public watch: Watch.Watch;

    /** A helper for creating directives */
    static directive = Directives.directive;

    /** @constructor */
    constructor ( options: Options = {} ) {
        this.watch = options.hasOwnProperty("watch") ? options.watch : null;
    }

    /** Attaches this configuration to a DOM element */
    bind ( root: HTMLElement, data: any ): void {
        var config = new Config.Config(this);
        var section = Parse.parse(
            Traverse.Reader.create(config, root),
            config,
            new Data.Root(data)
        );
        section.connect();
    }
}


