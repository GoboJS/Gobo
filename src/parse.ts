/// <reference path="traverse.ts"/>

module Parse {

    /** A section contains directives and blocks */
    export class Section {

        /** Directives nested within this block */
        public bindings: Array<Watch.PathBinding> = [];

        /** Sections nested within this block */
        public sections: Array<Section> = [];

        /** Hooks up the behavior for this section */
        connect(): void {
            this.bindings.forEach((inner) => {
                inner.connect();
                inner.trigger();
            });
            this.sections.forEach((inner) => { inner.connect(); });
        }

        /** Disconnects the behavior for this block */
        disconnect(): void {
            this.bindings.forEach((inner) => { inner.disconnect(); });
            this.sections.forEach((inner) => { inner.disconnect(); });
        }
    }

    /** Calls a function on an object based on a directive type */
    function dispatch( config: Config, actions: {
        directive: (
            elem: Element, attr: Attr,
            directive: Directives.Directive) => void;
        block: (
            elem: Element, attr: Attr,
            directive: Block.Block) => void;
    }, elem: Element, attr: Attr ) {
        var name = config.stripPrefix(attr.name);
        var block = config.getBlock(name);
        if ( block ) {
            actions.block( elem, attr, new block(elem) );
        }
        else {
            var directive = config.getDirective(name)
            if (directive) {
                actions.directive( elem, attr, new directive(elem) );
            }
        }
    }

    /** Parses the DOM for directives and blocks */
    export function parse(
        traverse: Traverse.Reader, config: Config, data: Data
    ): Section {
        var section = new Section();

        traverse.each( dispatch.bind(null, config, {
            directive: function (elem, attr, directive) {

                var expr = new Expression( attr.value );

                // Hook up an observer so that any change to the
                // keypath causes the directive to be re-rendered
                section.bindings.push(new Watch.PathBinding(
                    config.watch,
                    data.eachKey.bind(data, expr.keypath),
                    () => { directive.execute(expr.resolve(data)); }
                ));
            },
            block: function parseBlock(elem, attr, block) {

                var expr = new Expression( attr.value );

                section.bindings.push(new Watch.PathBinding(
                    config.watch,
                    data.eachKey.bind(data, expr.keypath),
                    () => { block.execute(expr.resolve(data)); }
                ));

                section.sections.push(
                    parse(traverse.nested(elem), config, data)
                );
            }
        }) );

        return section;
    }

}

