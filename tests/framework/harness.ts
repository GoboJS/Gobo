/**
 * Scans the DOM for test case links, runs them in an iframe, then
 * reports the results
 */

module Harness {

    /** The result of a test pass */
    interface TestResult {
        name: string;
        result: boolean;
        message: string;
        duration: number;
    }

    /** The result of an entire test suite */
    interface SuiteResult {
        passed: number;
        failed: number;
        total: number;
        duration: number;
        tests: TestResult[];
    }

    /** Builds a result object */
    class ResultBuilder {

        /** When the result builder was created */
        private created = Date.now();

        /** The number of passed tests */
        private passed = 0;

        /** The number of failed tests */
        private failed = 0;

        /** The final result object */
        private tests: TestResult[] = [];

        /** @constructor */
        constructor (
            private total: number,
            private onComplete: (result: SuiteResult) => void
        ) {}

        /** Adds a result */
        report( result: TestResult ): void {
            this.tests.push(result);
            if ( result.result ) {
                this.passed++;
            }
            else {
                this.failed++;
            }

            if ( this.passed + this.failed === this.total ) {
                this.onComplete({
                    passed: this.passed,
                    failed: this.failed,
                    total: this.total,
                    duration: Date.now() - this.created,
                    tests: this.tests
                });
            }
        }
    }

    /** An individual test case */
    class TestCase {

        /** @constructor */
        constructor ( private elem: HTMLElement ) {}

        /** Returns the URL for this test case */
        url(): string {
            return this.elem.getAttribute('href');
        }

        /** Runs this test */
        run ( id: string ): void {
            var iframe = document.createElement("iframe");
            iframe.src = this.url() + "?" + id;
            this.elem.parentNode.insertBefore(iframe, null);
        }

        /** Reports a result back to this test case */
        report ( outcome: TestResult ): void {
            this.elem.className += outcome.result ? " success" : " failure";
            if ( !outcome.result && outcome.message ) {
                var error = document.createElement("div");
                error.classList.add("error");
                error.textContent = outcome.message;
                this.elem.parentNode.insertBefore(error, null);
            }
        }

        /** Returns the name of this test case */
        name(): string {
            return this.elem.getAttribute("test-suite") + ": " +
                this.elem.textContent.trim();
        }
    }

    /** Manages messages received from an iframe */
    module Messages {

        /** The callback that gets executed when a message is received */
        type Listener = ( data: any ) => void;

        /** A map of ids to listeners */
        var listeners: { [id: string]: Listener } = {};

        /** A global handler for listening for messages */
        window.addEventListener('message', function(e) {
            var data = JSON.parse(e.data);

            if ( data.id === undefined ) {
                throw new Error("Message received without an id" + data);
            }

            if ( !listeners[data.id] ) {
                throw new Error("No listener registered for " + data.id);
            }

            listeners[data.id](data);
        });

        /** Registers a function to be called for the given ID */
        export function subscribe ( id: string, callback: Listener ) {
            if ( listeners[id] ) {
                throw new Error("Listener already registered for: " + id);
            }
            listeners[id] = callback;
        }
    }

    /** Starts test execution */
    export function start(
        onComplete: (result: SuiteResult) => void,
        onFailure: (result: TestResult, url: string) => void = null
    ) {

        var tests =
            [].slice.call(document.querySelectorAll("[test-case]"))
                .map(elem => { return new TestCase(elem); });

        var results = new ResultBuilder(tests.length, onComplete);

        var ids = 0;

        /** Runs the next test */
        function next() {
            var test = tests.shift();

            if ( !test ) {
                return;
            }

            var id: string = "test-" + ids++;
            var start: number = Date.now();

            Messages.subscribe(id, data => {
                var result: TestResult = {
                    name: test.name(),
                    result: !!data.result,
                    message: data.message ? data.message : "",
                    duration: Date.now() - start
                };
                test.report(result);
                results.report(result);

                if ( !result.result ) {
                    onFailure(result, test.url());
                }

                // Run the next test
                next();
            });

            test.run(id);
        }

        for ( var i = 0; i < 6; i++ ) {
            next();
        }
    };
};

