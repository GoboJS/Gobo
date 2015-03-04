/// <reference path="browser.d.ts"/>

module Traverse {

    /** Grab the next sibling of a Node that is an HTMLElement */
    function nextElementSibling( elem: Node ): HTMLElement {
        do {
            elem = elem.nextSibling;
            if ( elem && elem.nodeType === 1 ) {
                return <HTMLElement> elem;
            }
        } while ( elem );
    }

    /** Iterates over every value beneath a node, including that node */
    class DOMIterator {

        /** The next element, if any */
        private nextElem: HTMLElement;

        /** @constructor */
        constructor (private root: HTMLElement) {
            this.nextElem = this.findNextElem(root);
        }

        /** Searches for the next element to visit */
        private findNextElem( elem: HTMLElement ): HTMLElement {

            // Traverse through all the children of this node
            if ( elem.children[0] ) {
                return <HTMLElement> elem.children[0];
            }

            var nextSibling: HTMLElement;

            // Otherwise, move on to the siblings of this node. Or the siblings
            // of the parent of this node
            while ( elem && !(nextSibling = nextElementSibling(elem)) ) {

                // If this node doesn't have a next sibling, check it's parent.
                // And keep moving up the tree until you find a next sibling
                elem = <HTMLElement> (<any> elem).parentNode;

                // any time we move up a parent, confirm that we are still
                // within the bounds for the constrained root
                if ( !elem || !this.root.contains(elem) ) {
                    return undefined;
                }
            }

            return nextSibling;
        }

        /** Whether there is another element to visit */
        public hasNext(): boolean {
            return !!this.nextElem;
        }

        /** Returns the next element */
        public next(): HTMLElement {
            var current = this.nextElem;
            this.nextElem = this.findNextElem(current);
            return current;
        }
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

    /** Scans through elements with directives */
    class ScanIterator {

        /** The source of DOM nodes */
        private elements: DOMIterator;

        /** The next element being iterated over */
        private nextElem: HTMLElement;

        /** Upcoming attributes */
        private nextAttrs: Attr[];

        /** @constructor */
        constructor (
            private config: Config,
            root: HTMLElement,
            rootAttrs?: Attr[]
        ) {
            this.elements = new DOMIterator(root);
            this.nextElem = root;

            this.nextAttrs = rootAttrs ?
                rootAttrs.slice() :
                getAttrs(root, config);
        }

        /** Whether there is another attribute */
        public hasNext(): boolean {
            if ( this.nextAttrs.length > 0 ) {
                return true;
            }

            do {
                if ( !this.elements.hasNext() ) {
                    return false;
                }
                this.nextElem = this.elements.next();
                this.nextAttrs = getAttrs(this.nextElem, this.config);
            } while ( this.nextAttrs.length === 0 );

            return this.nextAttrs.length > 0;
        }

        /** Increments to the next element */
        public next(): { elem: HTMLElement; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs.shift() };
            }
        }

        /** Return the next element without incrementing to it */
        public peek(): { elem: HTMLElement; attr: Attr } {
            if ( this.hasNext() ) {
                return { elem: this.nextElem, attr: this.nextAttrs[0] };
            }
        }
    }

    /** Reads elements from the DOM with matching attributes */
    export class Reader {

        /** @constructor */
        constructor (private iter: ScanIterator, public root: HTMLElement) {}

        /** Creates a new instance */
        static create(config: Config, root: HTMLElement, rootAttrs?: Attr[]) {
            return new Reader(new ScanIterator(config, root, rootAttrs), root);
        }

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

