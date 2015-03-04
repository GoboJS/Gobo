module Components {

    /** Creates a dom node from a string */
    function nodeFromString( doc: Document, source: string ): Element {
        var div = doc.createElement("div");
        div.innerHTML = source;
        if ( div.children.length !== 1 ) {
            throw new Error("HTML snippet has more than one root nodes");
        }
        return div.children[0];
    }

    /** Components allow tags to be replaced with reusable content */
    export class Component {

        /** @constructor */
        constructor( private proto: string ) {}

        /** Replaces a node with this component, returning the new node */
        replace( replace: Node ): Node {
            var component = nodeFromString(replace.ownerDocument, this.proto);
            replace.parentNode.replaceChild(component, replace);
            return component;
        }
    }

    /** A data type from which a component can be built */
    export type ComponentSource = string;

    /** Creates a component */
    export function component ( source: string ): Component {
        return new Component(source);
    };

}

