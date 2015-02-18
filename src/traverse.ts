/// <reference path="browser.d.ts"/>

module Traverse {

    /** Iterates over the values in an xpath result */
    class XPathIterator {

        /** The XPath result object being iterated over */
        private nodes: XPathResult;

        /** The next element being iterated over */
        private nextElem: Element;

        /** Upcoming attributes */
        private nextAttrs: Attr[] = [];

        /** Searches for the given prefix on the given node */
        constructor ( private prefix: string, root: Node ) {
            this.nodes = root.ownerDocument.evaluate(
                ".//*[@*[starts-with(name(), '" + prefix + "')]]",
                root, null, 0, null
            );
        }

        /** Whether there is another attribute */
        public hasNext(): boolean {
            if ( this.nextAttrs.length > 0 ) {
                return true;
            }

            this.nextElem = <Element> this.nodes.iterateNext();
            if ( !this.nextElem ) {
                return false;
            }

            this.nextAttrs = [].slice.call(this.nextElem.attributes).filter(
                (attr) => { return attr.name.indexOf(this.prefix) === 0; }
            );

            return true;
        }

        /** Increments to the next element */
        public next(): { elem: Element; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs.shift() };
            }
        }

        /** Return the next element without incrementing to it */
        public peek(): { elem: Element; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs[0] };
            }
        }
    }

    /** Reads elements from the DOM with matching attributes */
    export class Reader {

        /** Searches for the given prefix on the given node */
        static search ( prefix: string, root: Node ) {
            return new Reader( new XPathIterator(prefix, root) );
        }

        /** Searches for the given prefix on the given node */
        constructor ( private iter: XPathIterator, private within?: Node ) {}

        /** Executes a callback for each matching element */
        each( callback: (elem: Element, attr: Attr) => void ): void {
            while ( this.iter.hasNext() ) {

                // If we are only examining nodes within another node, apply
                // that constraint and bail
                if ( this.within ) {
                    var peek = this.iter.peek();
                    if ( !this.within.contains(peek.elem) ) {
                        return;
                    }
                }

                var next = this.iter.next();
                callback(next.elem, next.attr);
            }
        }

        /** Returns an iterator for elements within a node */
        nested( elem: Node ): Reader {
            return new Reader(this.iter, elem);
        }
    }
}

