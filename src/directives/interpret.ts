/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Inserts a node after another node */
    function insertAfter( toInsert: Node, insertAfter: Node ): void {
        insertAfter.parentNode.insertBefore(toInsert, insertAfter.nextSibling);
    }

    // The regex needed to extract expressions from text
    var splitRegex = /\{\{(.+?)\}\}/;

    /** Interprets the content of a node */
    export class InterpretStatement implements Directive {

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
        constructor( elem: Node, details: Details ) {
            var document = elem.ownerDocument;

            for (var node = elem.firstChild; node; node = node.nextSibling) {
                if ( node.nodeType === 3 ) {
                    var parts = node.textContent.split(splitRegex);
                    node.textContent = parts[0];

                    for ( var i = 1; i < parts.length; i += 2 ) {

                        // Create and attach a node for the expression
                        var exprNode = document.createTextNode("");
                        insertAfter( exprNode, node );
                        details.parseExpr(parts[i], function (value) {
                            this.textContent = value === undefined ? "" : value;
                        }.bind(exprNode));

                        // Add the remaining content as a regular text node
                        var textNode = document.createTextNode(parts[i + 1]);
                        insertAfter( textNode, exprNode );
                        node = textNode;
                    }
                }
            }
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            // Nothing to see here. Interpret statements are purely parse time
        }
    }
}


