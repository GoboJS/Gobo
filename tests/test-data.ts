/// <reference path="framework.ts"/>

declare var require: (string) => any;
declare var module: any;

/**
 * Accumulates and exposes all the test data in a hash
 */
module Test {

    /** A list of registered test suites */
    export var suites: SuiteSet = {};

    /** Defines a test suite */
    export function test(suite: string, tests: ( should: Should ) => void) {
        if ( !suites[suite] ) {
            suites[suite] = {};
        }

        tests(function should ( name: string ) {
            return {
                using: function using ( html: string ) {
                    return {
                        in: function (logic: Logic): void {
                            suites[suite][name] = { html: html, logic: logic };
                        }
                    };
                }
            };
        });
    }
}

module.exports = function data() {
    return Test.suites;
};


