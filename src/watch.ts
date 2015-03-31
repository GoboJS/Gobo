/// <reference path="connect.ts"/>
/// <reference path="data.ts"/>

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

    /** The callback used for iterating over the keys of a data chain */
    export type EachKeyCallback = (obj: any, key: string) => void;

    /**
     * An ordered list of watchers. When one of the functions is triggered, it
     * automatically invalidates all of the watchers that come after it
     */
    export class PathBinding implements Connect.Connectable {

        /** The list of objects to which watchers have been bound */
        private roots: Array<any> = [];

        /**
         * @constructor
         * @param watch The interface for setting up an observer
         * @param each Calls a function for each value in the keypath
         * @param trigger The callback to invoke when there is a change
         */
        constructor(
            private watch: Watch,
            private getRoot: () => any,
            private keypath: Data.Keypath,
            private trigger: () => void
        ) {}

        /** Applies a callback to each object/key in a chain */
        private eachKey ( callback: EachKeyCallback ): void {
            return this.keypath.reduce((obj, key) => {
                callback(obj, key);
                if ( obj !== null && obj !== undefined ) {
                    return obj[key];
                }
            }, this.getRoot());
        }

        /** @inheritDoc Connect#connect */
        public connect() {
            if ( !this.watch ) {
                return;
            }

            var i = 0;
            this.eachKey((obj, key) => {

                // If the object at this depth has changed since the last
                // iteration, we need to unbind from the old object
                if ( this.roots[i] && this.roots[i] !== obj ) {
                    this.watch.unwatch(this.roots[i], key, this.trigger);
                    this.roots[i] = null;
                }

                // If there is no watch at this level, or the watch was just
                // cleared out, we need to add one
                if ( !this.roots[i] && obj ) {
                    this.watch.watch(obj, key, this.trigger, 0);
                    this.roots[i] = obj;
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
            this.eachKey((_, key) => {
                if ( this.roots[i] ) {
                    this.watch.unwatch(this.roots[i], key, this.trigger);
                    this.roots[i] = null;
                }
                i++;
            });
        }
    }
}

