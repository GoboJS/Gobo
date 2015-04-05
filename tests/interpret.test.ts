/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Interpret directives', (should) => {

    should('Be able to parse expressions').using(
        `<div id='elem' g-interpret>{{ name | uppercase }}</div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, { name: "Lug MightyChunk" });

        assert.equal( $.cleanup($.textById('elem')), "LUG MIGHTYCHUNK" );

        done();
    });

    should('Parse multiple expressions').using(
        `<div id='elem' g-interpret>
            First: {{ name.first }}
            Last: {{ name.last }}
        </div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, {
            name: { first: "Lug", last: "MightyChunk" }
        });

        assert.equal(
            $.cleanup($.textById('elem')),
            "First: Lug Last: MightyChunk"
        );

        done();
    });

    should('Not modify text without directives').using(
        `<div id='elem' g-interpret>{ Not an expression }</div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, {});
        assert.equal($.cleanup($.textById('elem')), "{ Not an expression }");
        done();
    });

    should('Not interpret nested expressions').using(
        `<div id='elem' g-interpret>
            {{ name.first }}
            <div>{{ name }}</div>
            {{ name.last }}
        </div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, {
            name: { first: "Lug", last: "MightyChunk" }
        });

        assert.equal(
            $.cleanup($.textById('elem')),
            "Lug {{ name }} MightyChunk"
        );

        done();
    });

    should('Treat undefined as a blank string').using(
        `<div id='elem' g-interpret>{{ undefined }}</div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, {});

        assert.equal( $.cleanup($.textById('elem')), "" );

        done();
    });

});

