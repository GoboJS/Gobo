/// <reference path="definition.ts"/>
/// <reference path="../data.ts"/>

module Directives {

    /** Sets a variable based on an expression */
    export class WithStatement implements Directive {

        /** @inheritDoc DirectiveBuilder#priority */
        public static priority = 200;

        /** @inheritDoc Connection#connect */
        public connect: () => void;

        /** @inheritDoc Connect#disconnect */
        public disconnect: () => void;

        /**
         * @constructor
         * @inheritDoc Directive#constructor
         */
        constructor( elem: Node, details: Details ) {

            var data = details.data.scope(details.param, details.expression);
            var section = details.parse(data);

            this.connect = section.connect.bind(section);
            this.disconnect = section.disconnect.bind(section);
        }

        /** @inheritDoc Directive#execute */
        execute ( value: any ): void {
            // With directives are strictly parse time, so nothing to do here
        }
    }
}

