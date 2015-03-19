/// <reference path="connect.ts"/>

module Watch {

    /** A mechanism for observing a value on an object */
    export interface Watch {

        /** Sets up a watch on a key */
        watch(
            obj: any, key: string, callback: () => void, depth?: number
        ): void;

        /** Removes a watch */
        unwatch( obj: any, key: string, callback: () => void ): void;
    }

    /**
     * An ordered list of watchers. When one of the functions is triggered, it
     * automatically invalidates all of the watchers that come after it
     */
    export class PathBinding implements Connect.Connectable {

        /** The list of objects to which watchers have been bound */
        private watches: Array<any> = [];

        /**
         * @constructor
         * @param watch The interface for setting up an observer
         * @param each Calls a function for each value in the keypath
         * @param trigger The callback to invoke when there is a change
         */
        constructor(
            private watch: Watch,
            private each: (callback: Data.EachKeyCallback) => void,
            private trigger: () => void
        ) {}

        /** @inheritDoc Connect#connect */
        public connect() {
            if ( !this.watch ) {
                return;
            }

            var i = 0;
            this.each((obj, key) => {

                // If the object at this depth has changed since the last
                // iteration, we need to unbind from the old object
                if ( this.watches[i] && this.watches[i] !== obj ) {
                    this.watch.unwatch(this.watches[i], key, this.trigger);
                    this.watches[i] = null;
                }

                // If there is no watch at this level, or the watch was just
                // cleared out, we need to add one
                if ( !this.watches[i] && obj ) {
                    this.watch.watch(obj, key, this.trigger, 0);
                    this.watches[i] = obj;
                }

                i++;
            });
        }

        /** @inheritDoc Connect#disconnect */
        public disconnect() {
            if ( !this.watch ) {
                return;
            }

            var i = 0;
            this.each((_, key) => {
                if ( this.watches[i] ) {
                    this.watch.unwatch(this.watches[i], key, this.trigger);
                    this.watches[i] = null;
                }
                i++;
            });
        }
    }
}

