module Config {

    /** An interface into the gobo configuration */
    export class Config {

        /** The observation module to use for watching values */
        public watch: Watch.Watch;

        /** The start of each directive */
        public prefix: string;

        /** A lookup for resolving filters */
        public filters: Filters.DefaultFilters;

        /** A lookup for resolving directives */
        private getDirectiveByName:
            (string) => Wildcard.Tuple<Directives.DirectiveBuilder>;

        /** The default components */
        private components: { [key: string]: Components.Component } = {};

        /** @constructor */
        constructor ( gobo: Gobo ) {
            this.watch = gobo.watch;
            this.prefix = gobo.prefix;
            this.filters = gobo.filters;
            this.getDirectiveByName =
                Wildcard.createLookup<Directives.DirectiveBuilder>(
                    gobo.directives
                );

            for ( var key in gobo.components ) {
                // Purposefully missing the hasOwnProperty check. Picking up
                // values from the prototype allows inheritence to work here
                this.components[key] =
                    new Components.Component(gobo.components[key]);
            }
        }

        /** Strips the prefix off of a string */
        getDirective(
            attr: Attr
        ): Wildcard.Tuple<Directives.DirectiveBuilder> {
            return this.getDirectiveByName(
                attr.name.substr(this.prefix.length)
            );
        }

        /** Returns the priority of a directive */
        getPriority( attr: Attr ): number {
            var tuple = this.getDirective(attr);
            if ( !tuple ) {
                return 0;
            }
            return tuple.value.priority || 0;
        }

        /** Whether a string starts with the prefix */
        isPrefixed( str: string ): boolean {
            return str.indexOf(this.prefix) === 0;
        }

        /** Returns the component given a tag name */
        getComponent( name: string ): Components.Component {
            name = name.substr(this.prefix.length);
            if ( !this.components[name] ) {
                throw new Error("Unrecognized Component: " + name);
            }
            return this.components[name];
        }
    }
}
