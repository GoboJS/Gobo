/// <reference path="browser.d.ts"/>

module Traverse {

    interface DirectiveIterator {

        /** Whether there is another attribute */
        hasNext(): boolean;

        /** Increments to the next element */
        next(): { elem: HTMLElement; attr: Attr };

        /** Return the next element without incrementing to it */
        peek(): { elem: HTMLElement; attr: Attr };
    }

    /** Iterates over the values in an xpath result */
    export class XPathIterator implements DirectiveIterator {

        /** The XPath result object being iterated over */
        private nodes: XPathResult;

        /** The next element being iterated over */
        private nextElem: HTMLElement;

        /** Upcoming attributes */
        private nextAttrs: Attr[] = [];

        /** Searches for the given prefix on the given node */
        constructor ( private prefix: string, root: Node ) {
            this.nodes = root.ownerDocument.evaluate(
                ".//*[@*[starts-with(name(), '" + prefix + "')]]",
                root, null, 0, null
            );
        }

        /** @inheritdoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            if ( this.nextAttrs.length > 0 ) {
                return true;
            }

            this.nextElem = <HTMLElement> this.nodes.iterateNext();
            if ( !this.nextElem ) {
                return false;
            }

            this.nextAttrs = [].slice.call(this.nextElem.attributes).filter(
                (attr) => { return attr.name.indexOf(this.prefix) === 0; }
            );

            return true;
        }

        /** @inheritdoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs.shift() };
            }
        }

        /** @inheritdoc DirectiveIterator#peek */
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

        constructor( private elem: HTMLElement, private attrs: Attr[] ) {}

        /** @inheritdoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            return this.i < this.attrs.length;
        }

        /** @inheritdoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            return { elem: this.elem, attr: this.attrs[this.i++] };
        }

        /** @inheritdoc DirectiveIterator#peek */
        public peek(): { elem: HTMLElement; attr: Attr } {
            return { elem: this.elem, attr: this.attrs[this.i] };
        }
    }

    /** Iterates over two other iterators */
    export class JoinIterator implements DirectiveIterator {
        constructor(
            private one: DirectiveIterator,
            private two: DirectiveIterator
        ) {}

        /** @inheritdoc DirectiveIterator#hasNext */
        public hasNext(): boolean {
            return this.one.hasNext() || this.two.hasNext();
        }

        /** @inheritdoc DirectiveIterator#next */
        public next(): { elem: HTMLElement; attr: Attr } {
            return this.one.hasNext() ? this.one.next() : this.two.next();
        }

        /** @inheritdoc DirectiveIterator#peek */
        public peek(): { elem: HTMLElement; attr: Attr } {
            return this.one.hasNext() ? this.one.peek() : this.two.peek();
        }
    }

    /** Reads elements from the DOM with matching attributes */
    export class Reader {

        /** Searches for the given prefix on the given node */
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

    /** Searches for the given prefix on the given node */
    export function search ( config: Config, root: HTMLElement ) {
        return new Reader( new XPathIterator(config.prefix, root), root );
    }

}

