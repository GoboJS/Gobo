/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Swaps the position of two DOM nodes */
    function domSwap(one: Node, two: Node): void {
        var placeholder = one.ownerDocument.createComment("");
        two.parentNode.replaceChild(placeholder, two);
        one.parentNode.replaceChild(two, one);
        placeholder.parentNode.replaceChild(one, placeholder);
    }

    /** Swaps the values of two array indexs */
    function indexSwap<T>(values: T[], one: number, two: number): void {
        var temp = values[one];
        values[one] = values[two];
        values[two] = temp;
    }

    /** Loops over a value */
    export class EachStatement implements Directive {

        /**
         * Marks the final position of the list so new elements can quickly
         * be appended using 'insertBefore'
         */
        private end: Node;

        /** The section to clone for each sub-element */
        private template: Parse.Cloneable;

        /** Creates a scoped data object */
        private scope: (value: any) => Data.Data;

        /** The list of currently active subsections */
        private sections: Array<Parse.Section> = [];

        /**
         * The values current represented in the DOM. This is tracked to
         * reduce the churn and recycle as many sections as possible
         */
        private values: Array<any> = [];

        /** @inheritdoc Directive#constructor */
        constructor( elem: Node, details: Details ) {
            this.end = elem.ownerDocument.createTextNode("");
            this.template = details.cloneable();

            this.scope = (value) => {
                return details.data.scope(details.param, value);
            };
        }

        /** @inheritdoc Directive#initialize */
        initialize (): void {
            // Replace the root DOM element with the placeholder
            this.template.root.parentNode.replaceChild(
                this.end, this.template.root );
        }

        /** @inheritdoc Directive#execute */
        execute ( value: any ): void {
            var i = 0;
            value.forEach((value: any) => {

                // Only recreate this section if the value has changed
                if ( this.values[i] === value ) {
                    i++;
                    return;
                }

                // If this value exists in the list of values, we should
                // repurpose the existing section rather than creating a new one
                var found = this.values.indexOf(value, i + 1);
                if ( found !== -1 ) {
                    domSwap(this.sections[i].root, this.sections[found].root);
                    indexSwap(this.sections, i, found);
                    indexSwap(this.values, i, found);
                    i++;
                    return;
                }

                var newSection;

                if ( this.sections[i] ) {
                    // If there is already a section at this index,
                    // then replacce it
                    newSection = this.template.cloneReplace(
                        this.sections[i], this.scope(value));
                    this.sections[i].disconnect();
                }
                else {
                    // Otherwise, add it to the end of the list
                    newSection = this.template.cloneBefore(
                        this.end, this.scope(value));
                }

                this.sections[i] = newSection;
                this.values[i] = value;

                newSection.initialize();
                newSection.connect();

                i++;
            });

            // Remove any extra sections
            for ( ; this.sections.length > i; i++ ) {
                this.values.pop();
                this.sections.pop().destroy();
            }
        }
    }

}
