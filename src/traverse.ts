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

    /** Grab the next sibling of a Node that is an HTMLElement */
    function nextElementSibling( elem: Node ): HTMLElement {
        do {
            elem = elem.nextSibling;
            if ( elem && elem.nodeType === 1 ) {
                return <HTMLElement> elem;
            }
        } while ( elem );
    }

    /** Iterates over the values in an xpath result */
    export class ScanIterator implements DirectiveIterator {

        /** The next element being iterated over */
        private nextElem: HTMLElement;

        /** Upcoming attributes */
        private nextAttrs: Attr[] = [];

        /** @constructor */
        constructor (private config: Config, private root: HTMLElement) {
            this.nextElem = root;
        }

        /** Searches for the next element to visit */
        private findNextElem( next: HTMLElement ): HTMLElement {

            // Traverse through all the children of this node
            if ( next.children[0] ) {
                return <HTMLElement> next.children[0];
            }

            var nextSibling: HTMLElement;

            // Otherwise, move on to the siblings of this node. Or the siblings
            // of the parent of this node
            while ( next && !(nextSibling = nextElementSibling(next)) ) {

                // If this node doesn't have a next sibling, check it's parent.
                // And keep moving up the tree until you find a next sibling
                next = <HTMLElement> (<any> next).parentNode;

                // any time we move up a parent, confirm that we are still
                // within the bounds for the constrained root
                if ( !next || !this.root.contains(next) ) {
                    return undefined;
                }
            }

            return nextSibling;
        }

        /** @inheritDoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            if ( this.nextAttrs.length > 0 ) {
                return true;
            }

            if ( !this.nextElem ) {
                return false;
            }

            do {
                this.nextElem = this.findNextElem( this.nextElem );
                if ( !this.nextElem ) {
                    return false;
                }
                this.nextAttrs = getAttrs(this.nextElem, this.config);
            } while ( this.nextAttrs.length === 0 );

            return this.nextAttrs.length > 0;
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

