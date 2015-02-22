/// <reference path="traverse.ts"/>

module Parse {

    /** A section contains directives and blocks */
    export class Section {

        /** Directives nested within this block */
        public bindings: Array<Watch.PathBinding> = [];

        /** Directives nested within this block */
        public directives: Array<Directives.Directive> = [];

        /** Finalize the construction of directives within this section */
        initialize(): void {
            this.directives.forEach((inner) => {
                if ( inner.initialize ) {
                    inner.initialize();
                }
            });
        }

        /** Hooks up the behavior for this section */
        connect(): void {
            this.bindings.forEach((inner: Watch.PathBinding) => {
                inner.connect();
                inner.trigger();
            });
            this.directives.forEach((inner) => {
                if ( inner.connect ) {
                    inner.connect();
                }
            });
        }

        /** Disconnects the behavior for this block */
        disconnect(): void {
            this.bindings.forEach((inner) => { inner.disconnect(); });
            this.directives.forEach((inner) => {
                if ( inner.disconnect ) {
                    inner.disconnect();
                }
            });
        }
    }

    /** A node that can be cloned to create new sections */
    export class Cloneable {
        constructor (
            public root: HTMLElement,
            private attrs: Array<Attr>,
            private config: Config
        ) {}

        /** Creates a new section and adds it before the given node */
        cloneBefore( before: Node, data: Data ): Section {
            var cloned = <HTMLElement> this.root.cloneNode(true);
            before.parentNode.insertBefore(cloned, before);
            var traverse = Traverse.search(this.config, cloned);
            return parse(traverse, this.config, data);
        }
    }


    /** Parses the DOM for directives and blocks */
    export function parse(
        traverse: Traverse.Reader, config: Config, data: Data
    ): Section {

        var section = new Section();

        traverse.each(function eachAttr(elem: HTMLElement, attr: Attr) {

            var name = config.stripPrefix(attr.name);
            var directive = config.getDirective(name);
            if ( !directive) {
                return;
            }

            var instance = new directive.value(elem, {
                param: directive.tail,
                data: data,
                parse: function parseNested(): Section {
                    return parse(traverse.nested(elem), config, data);
                },
                cloneable: function parseCloneable(): Cloneable {
                    return cloneable(traverse.nested(elem), config);
                }
            });

            section.directives.push(instance);

            var expr = new Expression( attr.value );

            // Hook up an observer so that any change to the
            // keypath causes the directive to be re-rendered
            section.bindings.push(new Watch.PathBinding(
                config.watch,
                data.eachKey.bind(data, expr.keypath),
                () => { instance.execute(expr.resolve(data)); }
            ));
        });

        return section;
    }

    /** Parses a section to create a cloneable block */
    export function cloneable(
        traverse: Traverse.Reader, config: Config
    ): Cloneable {

        var attrs: Array<Attr> = [];
        traverse.each(function eachAttr(elem: HTMLElement, attr: Attr) {
            if ( elem === traverse.root ) {
                attrs.push(attr);
            }
        });

        return new Cloneable(traverse.root, attrs, config);
    }

}

