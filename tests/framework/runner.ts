/// <reference path="framework.ts"/>

module Test {

    /** The logic for running a test */
    type TestCase = ( done: () => void, $: Test.DocReader ) => void;

    /** Runs a test */
    export function run ( testId: number, logic: TestCase ) {

        /** Reports a result back up the chain */
        function report ( result: boolean, message: string ) {
            parent.postMessage( JSON.stringify({
                result: result,
                id: testId || document.location.search.substr(1),
                message: message
            }), "*" );

            if ( result ) {
                document.body.className += " success";
            }
            else {
                var messanger = document.createElement("div");
                messanger.className = "failure";
                messanger.textContent = message;
                document.body.insertBefore(
                    messanger, document.body.firstChild);
            }
        }

        // The results of the test
        var complete: { result: boolean; message: string };

        /** The 'done' function that gets passed to the test */
        function done ( result, message ) {
            if ( !complete ) {
                complete = { result: result, message: message };

                // Delaying the report allows errors to be caught that
                // happen after 'done' is invoked
                setTimeout(function () {
                    report( complete.result, complete.message );
                }, 0);
            }
            else if ( !result ) {
                complete = { result: result, message: message };
            }
            else {
                complete = {
                    result: false,
                    message: "'done' called multiple times"
                };
            }
        }


        // If an error is thrown, report a failure
        window.onerror = done.bind(null, false);

        // 500ms timeout for running the test
        setTimeout(done.bind(null, false, "Test Timeout"), 500);

        (<any> window).assert = (<any> window).chai.assert;

        // Run the test
        logic(
            done.bind(null, true, "Passed"),
            new Test.DocReader(document)
        );
    }

}

