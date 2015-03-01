/// <reference path="browser.d.ts"/>

module Traverse {

    /** Iterates over the nodes and attributes found from a search */
    interface DirectiveIterator {

        /** Whether there is another attribute */
        hasNext(): boolean;

        /** Increments to the next element */
        next(): { elem: HTMLElement; attr: Attr };

        /** Return the next element without incrementing to it */
        peek(): { elem: HTMLElement; attr: Attr };
    }

    /** Returns the attributes for a specific element */
    function getAttrs( elem: HTMLElement, config: Config ): Attr[] {
        return [].slice.call(elem.attributes)
            .filter((attr) => {
                return attr.name.indexOf(config.prefix) === 0;
            })
            .sort((a, b) => {
                return config.getPriority(b) - config.getPriority(a);
            });
    }

    /** Iterates over the values in an xpath result */
    export class XPathIterator implements DirectiveIterator {

        /** The XPath result object being iterated over */
        private nodes: XPathResult;

        /** The next element being iterated over */
        private nextElem: HTMLElement;

        /** Upcoming attributes */
        private nextAttrs: Attr[] = [];

        /** @constructor */
        constructor (private config: Config, root: Node) {
            this.nodes = root.ownerDocument.evaluate(
                ".//*[@*[starts-with(name(), '" + config.prefix + "')]]",
                root, null, 0, null
            );
        }

        /** @inheritDoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            if ( this.nextAttrs.length > 0 ) {
                return true;
            }

            this.nextElem = <HTMLElement> this.nodes.iterateNext();
            if ( !this.nextElem ) {
                return false;
            }

            this.nextAttrs = getAttrs(this.nextElem, this.config);

            return true;
        }

        /** @inheritDoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs.shift() };
            }
        }

        /** @inheritDoc DirectiveIterator#peek */
        public peek(): { elem: HTMLElement; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs[0] };
            }
        }
    }

    /** Iterates over the exact values given */
    export class ExactIterator implements DirectiveIterator {

        /** The current offset of the iteration */
        private i = 0;

        /** @constructor */
        constructor( private elem: HTMLElement, private attrs: Attr[] ) {}

        /** @inheritDoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            return this.i < this.attrs.length;
        }

        /** @inheritDoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            return { elem: this.elem, attr: this.attrs[this.i++] };
        }

        /** @inheritDoc DirectiveIterator#peek */
        public peek(): { elem: HTMLElement; attr: Attr } {
            return { elem: this.elem, attr: this.attrs[this.i] };
        }
    }

    /** Creates an iterator for the attributes on the given element */
    export function element(
        elem: HTMLElement, config: Config
    ): DirectiveIterator {
        return new ExactIterator(elem, getAttrs(elem, config));
    }

    /** Iterates over two other iterators */
    export class JoinIterator implements DirectiveIterator {

        /** @constructor */
        constructor(
            private one: DirectiveIterator,
            private two: DirectiveIterator
        ) {}

        /** @inheritDoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            return this.one.hasNext() || this.two.hasNext();
        }

        /** @inheritDoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            return this.one.hasNext() ? this.one.next() : this.two.next();
        }

        /** @inheritDoc DirectiveIterator#peek */
        public peek(): { elem: HTMLElement; attr: Attr } {
            return this.one.hasNext() ? this.one.peek() : this.two.peek();
        }
    }

    /** Reads elements from the DOM with matching attributes */
    export class Reader {

        /** @constructor */
        constructor (
            private iter: DirectiveIterator,
            public root: HTMLElement
        ) {}

        /** Executes a callback for each matching element */
        each( callback: (elem: HTMLElement, attr: Attr) => void ): void {
            while ( this.iter.hasNext() ) {

                var peek = this.iter.peek().elem;
                if ( this.root !== peek && !this.root.contains(peek) ) {
                    return;
                }

                var next = this.iter.next();
                callback(next.elem, next.attr);
            }
        }

        /** Returns an iterator for elements within a node */
        nested( elem: HTMLElement ): Reader {
            return new Reader(this.iter, elem);
        }
    }
}

