/// <reference path="traverse.ts"/>
/// <reference path="watch.ts"/>
/// <reference path="data.ts"/>
/// <reference path="expression.ts"/>
/// <reference path="config.ts"/>
/// <reference path="connect.ts"/>
/// <reference path="directives/definition.ts"/>

module Parse {

    /** A section contains directives and blocks */
    export class Section {

        /** A list of priorities that exist within this section */
        private priorities: number[] = [];

        /** Directives and sections nested within this block */
        private nested: { [priority: number]: Connect.Connectable[] } = {};

        /** @constructor */
        constructor( public root: HTMLElement ) {}

        /** Adds a connectable to this section */
        push ( priority: number, connectable: Connect.Connectable ) {
            priority = priority || 0;

            // If this specific priority has never been seen, register it
            if ( !this.nested[priority] ) {
                this.nested[priority] = [];
                this.priorities.push(priority);
                this.priorities.sort((a, b) => { return b - a; });
            }

            this.nested[priority].push(connectable);
        }

        /** Adds an expression to this section */
        pushExpr(
            priority: number, watch: Watch.Watch,
            expr: Expr.Atom, trigger: () => void
        ): void {

            // Hook up an observer so that any change to the
            // keypath causes the trigger to be re-executed
            expr.eachBinding((getRoot, keypath) => {
                this.push(
                    priority,
                    new Watch.PathBinding(watch, getRoot, keypath, trigger)
                );
            });

            // Make sure we do an initial trigger whenever connecting
            this.push(priority, { connect: trigger });
        }

        /** Adds everything from another section to this section */
        merge ( section: Section ) {
            section.priorities.forEach(priority => {
                section.nested[priority].forEach(connectable => {
                    this.push(priority, connectable);
                });
            });
        }

        /** @inheritDoc Connect#connect */
        connect(): void {
            for (var i = 0; i < this.priorities.length; i++) {
                var priority = this.priorities[i];
                for (var j = 0; j < this.nested[priority].length; j++) {
                    var inner = this.nested[priority][j];
                    if ( inner.connect ) {
                        inner.connect();
                    }
                }
            }
        }

        /** @inheritDoc Connect#disconnect */
        disconnect(): void {
            for (var i = 0; i < this.priorities.length; i++) {
                var priority = this.priorities[i];
                for (var j = 0; j < this.nested[priority].length; j++) {
                    var inner = this.nested[priority][j];
                    if ( inner.disconnect ) {
                        inner.disconnect();
                    }
                }
            }
        }

        /** Disconnects this section and removes it */
        destroy(): void {
            this.disconnect();
            this.root.parentNode.removeChild(this.root);
            this.nested = null;
        }
    }

    /** A node that can be cloned to create new sections */
    export class Cloneable {

        /** @constructor */
        constructor (
            public root: HTMLElement,
            private attrs: Array<Attr>,
            private config: Config.Config
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
        traverse: Traverse.Reader, config: Config.Config,
        data: Data.Data, section: Section
    ): (elem: HTMLElement, attr: Attr) => void {
        return function parseDirective(elem, attr) {

            var tuple = config.getDirective(attr);
            if ( !tuple) {
                return;
            }

            var exprParser = new Expr.Parser(config, data, elem);

            var expr = exprParser.parse(attr.value);

            // Instantiate the directive itself
            var directive = new tuple.value(elem, {
                param: tuple.tail,
                data: data,
                parse: function parseNested( scoped?: Data.Data ): Section {
                    return parse(traverse.nested(elem), config, scoped || data);
                },
                cloneable: function parseCloneable(): Cloneable {
                    return cloneable(traverse.nested(elem), config);
                },
                expression: expr,
                publish: expr.publish.bind(expr),
                parseExpr: function parseExpr (
                    expression: string, trigger: (value: any) => void
                ): void {
                    var parsed = exprParser.parse(expression);
                    section.pushExpr(
                        tuple.value.priority,
                        config.watch,
                        parsed,
                        function triggerParsedExpr () {
                            trigger( parsed.read() );
                        }
                    );
                }
            });

            // Wrap the directive in a Debouncer to automatically manage
            // multiple calls to connect/disconnect
            Connect.debounce(directive);

            section.push(tuple.value.priority, directive);

            if ( directive.execute ) {

                // Evalutes the expression and triggers the directive. This
                // gets called any time the data changes.
                section.pushExpr(
                    tuple.value.priority,
                    config.watch,
                    expr,
                    function triggerDirective () {
                        var value = expr.read();
                        directive.execute(
                            !tuple.value.allowFuncs &&
                                typeof value === "function" ?
                                value() :
                                value
                        );
                    }
                );
            }
        };
    }

    /** Builds a function for parsing a component with the given context */
    function componentParser(
        traverse: Traverse.Reader, config: Config.Config,
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

            var exprParser = new Expr.Parser(config, data, replacement);

            // Grab the unprefix attributes and use them as variable masks
            var mask: { [key: string]: Expr.Atom; } = {};
            [].slice.call(elem.attributes).forEach((attr) => {
                if ( !config.isPrefixed(attr.name) ) {
                    mask[attr.name] = exprParser.parse(
                        attr.value || attr.name
                    );
                }
            });

            // The inner section parses the content of the component. It gets
            // masked data depending on the attributes passed to it
            outerSection.merge( parse(
                Traverse.Reader.create(config, replacement),
                config, new Data.Scoped(mask)
            ) );

            section.merge( outerSection );
        };
    }

    /** Parses the DOM for directives and blocks */
    export function parse(
        traverse: Traverse.Reader, config: Config.Config, data: Data.Data
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
        traverse: Traverse.Reader, config: Config.Config
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

