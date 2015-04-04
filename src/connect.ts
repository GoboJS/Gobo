module Connect {

    /** A behavior that can be connected and disconnected */
    export interface Connectable {

        /** Hooks up this behavior */
        connect?: () => void;

        /** Unhooks up this behavior */
        disconnect?: () => void;

        /** Whether this behavior is currently connected */
        connected?: boolean;
    }

    /**
     * Prevents a decorated object from connecting or disconnecting when
     * already in that state.
     */
    export function debounce( obj: Connectable ): void {

        if ( obj.connect ) {
            var originalConnect = obj.connect.bind(obj);
            obj.connect = function debounceConnect () {
                if ( !obj.connected ) {
                    obj.connected = true;
                    originalConnect();
                }
            };
        }

        if ( obj.disconnect ) {
            var originalDisconnect = obj.disconnect.bind(obj);
            obj.disconnect = function debounceDisconnect () {
                if ( obj.connected ) {
                    obj.connected = false;
                    originalDisconnect();
                }
            };
        }
    }


}
