/// <reference path="traverse.ts"/>
/// <reference path="watch.ts"/>
/// <reference path="data.ts"/>
/// <reference path="expression.ts"/>
/// <reference path="directives/definition.ts"/>

module Parse {

    /** A section contains directives and blocks */
    export class Section {

        /** Directives nested within this block */
        public bindings: Array<Watch.PathBinding> = [];

        /** Directives and sections nested within this block */
        public nested: Array<{
            connect?: () => void;
            disconnect?: () => void;
        }> = [];

        /** @constructor */
        constructor( public root: HTMLElement ) {}

        /** Hooks up the behavior for this section */
        connect(): void {
            this.bindings.forEach((inner: Watch.PathBinding) => {
                inner.connect();
                inner.trigger();
            });
            this.nested.forEach((inner) => {
                if ( inner.connect ) {
                    inner.connect();
                }
            });
        }

        /** Disconnects the behavior for this block */
        disconnect(): void {
            this.bindings.forEach((inner) => { inner.disconnect(); });
            this.nested.forEach((inner) => {
                if ( inner.disconnect ) {
                    inner.disconnect();
                }
            });
        }

        /** Disconnects this section and removes it */
        destroy(): void {
            this.disconnect();
            this.root.parentNode.removeChild(this.root);
            this.bindings = null;
            this.nested = null;
        }
    }

    /** A node that can be cloned to create new sections */
    export class Cloneable {

        /** @constructor */
        constructor (
            public root: HTMLElement,
            private attrs: Array<Attr>,
            private config: Config
        ) {}

        /** Parses a cloned node and returns the parsed section */
        private parse( cloned: HTMLElement, data: Data.Data ): Section {

            var traverse = Traverse.Reader.createSetRootAttrs(
                this.config, cloned, this.attrs
            );

            return parse(traverse, this.config, data);
        }

        /** Creates a new section and adds it before the given node */
        cloneBefore( before: Node, data: Data.Data ): Section {
            var cloned = <HTMLElement> this.root.cloneNode(true);
            before.parentNode.insertBefore(cloned, before);
            return this.parse(cloned, data);
        }

        /** Creates a new section replaces an existing section */
        cloneReplace( replace: Section, data: Data.Data ): Section {
            var cloned = <HTMLElement> this.root.cloneNode(true);
            replace.root.parentNode.replaceChild(cloned, replace.root);
            return this.parse(cloned, data);
        }
    }

    /** Builds a function for parsing a directive with the given context */
    function directiveParser(
        traverse: Traverse.Reader, config: Config,
        data: Data.Data, section: Section
    ): (elem: HTMLElement, attr: Attr) => void {
        return function parseDirective(elem, attr) {

            var tuple = config.getDirective(attr);
            if ( !tuple) {
                return;
            }

            var expr = new Expr.Expression( attr.value, config );

            // Instantiate the directive itself
            var directive = new tuple.value(elem, {
                param: tuple.tail,
                data: data,
                parse: function parseNested(): Section {
                    return parse(traverse.nested(elem), config, data);
                },
                cloneable: function parseCloneable(): Cloneable {
                    return cloneable(traverse.nested(elem), config);
                },
                publish: expr.set.bind(expr, data)
            });

            section.nested.push(directive);

            /**
             * Evalutes the expression and triggers the directive. This gets
             * called any time the data changes.
             */
            function trigger () {
                directive.execute(expr.resolve(data, tuple.value.allowFuncs));
            }

            // Hook up an observer so that any change to the
            // keypath causes the directive to be re-rendered
            expr.watches.forEach(watch => {
                section.bindings.push(new Watch.PathBinding(
                    config.watch,
                    data.eachKey.bind(data, watch),
                    trigger
                ));
            });
        };
    }

    /** Builds a function for parsing a component with the given context */
    function componentParser(
        traverse: Traverse.Reader, config: Config,
        data: Data.Data, section: Section
    ): (elem: HTMLElement, attrs: Attr[]) => void {
        return function parseComponent(elem, attrs) {

            var replacement = config.getComponent(elem.localName).replace(elem);

            // The outer section is used to parse attributes directly on
            // the element being replaced. They need access to the outer scope
            // of data
            var outerSection = parse(
                Traverse.Reader.createExactly(config, replacement, attrs),
                config, data
            );

            section.nested.push( outerSection );

            // Grab the unprefix attributes and use them as variable masks
            var mask: { [key: string]: string[]; } = {};
            [].slice.call(elem.attributes).forEach((attr) => {
                if ( !config.isPrefixed(attr.name) ) {
                    mask[attr.name] = Expr.parseKeypath(attr.value);
                }
            });

            // The inner section parses the content of the component. It gets
            // masked data depending on the attributes passed to it
            outerSection.nested.push( parse(
                Traverse.Reader.create(config, replacement),
                config, new Data.Mask(data, mask)
            ) );
        };
    }

    /** Parses the DOM for directives and blocks */
    export function parse(
        traverse: Traverse.Reader, config: Config, data: Data.Data
    ): Section {

        var section = new Section( traverse.root );

        traverse.each(
            directiveParser(traverse, config, data, section),
            componentParser(traverse, config, data, section)
        );

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

