module Components {

    /** A component source that is a function */
    type ComponentSourceFunc = (elem: Node) => ComponentSource;

    /** A data type from which a component can be built */
    export type ComponentSource = string | HTMLElement | ComponentSourceFunc;

    /**
     * Return whether a value is an HTML Element
     * @see http://stackoverflow.com/questions/384286
     */
    function isElement( obj: any ): boolean {
        if (typeof HTMLElement === "object") {
            return obj instanceof HTMLElement;
        }
        else {
            return obj &&
                typeof obj === "object" &&
                obj.nodeType === 1 &&
                typeof obj.nodeName === "string";
        }
    }

    /** Creates a new element to use for a component */
    function buildComponent(
        replace: Node,
        source: ComponentSource
    ): HTMLElement {

        if ( typeof source === "string" ) {
            var div = replace.ownerDocument.createElement("div");
            div.innerHTML = source;
            if ( div.children.length !== 1 ) {
                throw new Error("HTML snippet has more than one root nodes");
            }
            return <HTMLElement> div.children[0];
        }
        else if ( isElement(source) ) {
            return <HTMLElement> (<HTMLElement> source).cloneNode(true);
        }
        else if ( typeof source === "function" ) {
            return buildComponent(
                replace,
                (<ComponentSourceFunc> source)(replace)
            );
        }
        else {
            throw new Error("Could not build component from " + typeof source);
        }
    }

    /** Components allow tags to be replaced with reusable content */
    export class Component {

        /** @constructor */
        constructor( private proto: ComponentSource ) {}

        /** Replaces a node with this component, returning the new node */
        replace( replace: Node ): HTMLElement {
            var component = buildComponent(replace, this.proto);
            replace.parentNode.replaceChild(component, replace);
            return component;
        }
    }

    /** Creates a component */
    export function component ( source: ComponentSource ): Component {
        return new Component(source);
    };

}

