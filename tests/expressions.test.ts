/// <reference path="test-help.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var Gobo = require("../gobo.debug.js").Gobo;
var watch = require("watchjs");

describe('Expressions', function () {

    Test.should('allow single quotes').using(
        `<div>
            <span id='veal' g-text="veal.'full name'"></span>
            <span id='lug' g-text="lug.'full.name'"></span>
        </div>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            veal: { 'full name': "Veal Steakface" },
            lug: { 'full.name': "Lug ThickNeck" }
        });

        assert.equal( $.cleanup($.textById('veal')), "Veal Steakface" );
        assert.equal( $.cleanup($.textById('lug')), "Lug ThickNeck" );

        done();
    });

    Test.should('allow double quotes').using(
        `<div>
            <span id='veal' g-text='veal."full name"'></span>
            <span id='lug' g-text='lug."full.name"'></span>
        </div>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            veal: { 'full name': "Veal Steakface" },
            lug: { 'full.name': "Lug ThickNeck" }
        });

        assert.equal( $.cleanup($.textById('veal')), "Veal Steakface" );
        assert.equal( $.cleanup($.textById('lug')), "Lug ThickNeck" );

        done();
    });

    Test.should('allow filtering').using(
        `<div>
            <span id='one' g-text='name | one'></span>
            <span id='two' g-text='name | one | two'></span>
            <span id='three' g-text='name | one | two | three'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: watch });

        gobo.filters.one = str => { return "1" + str };
        gobo.filters.two = str => { return "2" + str };
        gobo.filters.three = str => { return "3" + str };

        var data = { name: "Veal" };
        gobo.bind($.body, data);
        assert.equal( $.cleanup($.textById('one')), "1Veal" );
        assert.equal( $.cleanup($.textById('two')), "21Veal" );
        assert.equal( $.cleanup($.textById('three')), "321Veal" );

        data.name = "Lug";
        assert.equal( $.cleanup($.textById('one')), "1Lug" );
        assert.equal( $.cleanup($.textById('two')), "21Lug" );
        assert.equal( $.cleanup($.textById('three')), "321Lug" );

        done();
    });

    Test.should('pass arguments to filter').using(
        `<div>
            <span g-text='input | keywords true false null undefined'></span>
            <span g-text='input | literals "some string" 10 4.5'></span>
            <span g-text='input | variable input some.thing'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: watch });

        gobo.filters.keywords = (value, t, f, n, u) => {
            assert.isTrue(t);
            assert.isFalse(f);
            assert.isNull(n);
            assert.isUndefined(u);
        };

        gobo.filters.literals = (value, s, i, f) => {
            assert.equal(s, "some string");
            assert.equal(i, 10);
            assert.equal(f, 4.5);
        };

        gobo.filters.variable = (value, one, two) => {
            assert.equal(one, "Veal");
            assert.equal(two, "wakka wakka");
        };

        gobo.bind($.body, { input: "Veal", some: { thing: "wakka wakka" } });

        done();
    });

    Test.should('bind persistent scratchpads to filters').using(
        `<div>
            <span g-text='one | scratch'></span>
            <span g-text='two | scratch'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: watch });

        gobo.filters.scratch = function (value) {
            switch ( value ) {
                case "first": this.store = "primary"; break;
                case "second": this.store = "secondary"; break;
                case "third": assert.equal("primary", this.store); break;
                case "fourth": assert.equal("secondary", this.store); break;
                default: throw "Should not be reached";
            }
        };

        var data = { one: "first", two: "second" };
        gobo.bind($.body, data);
        data.one = "third";
        data.two = "fourth";

        done();
    });

    Test.should('pass arguments').using(
        `<div id='values'>
            <span g-text='keywords true false null undefined'></span>
            <span g-text='literals "some string" 10 4.5'></span>
            <span g-text='variable input some.thing'></span>
        </div>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            input:  "Veal",
            some: { thing: "wakka wakka" },

            keywords: (t, f, n, u) => {
                assert.isTrue(t);
                assert.isFalse(f);
                assert.isNull(n);
                assert.isUndefined(u);
                return "one";
            },

            literals: (s, i, f) => {
                assert.equal(s, "some string");
                assert.equal(i, 10);
                assert.equal(f, 4.5);
                return "two";
            },

            variable: (one, two) => {
                assert.equal(one, "Veal");
                assert.equal(two, "wakka wakka");
                return "three";
            }
        });

        assert.equal( $.cleanup($.textById('values')), "one two three" );

        done();
    });

    Test.should('not call values that arent functions').using(
        `<div id='value' g-text='input true false'></div>`
    ).in((done, $) => {
        new Gobo().bind($.body, { input:  "Veal" });
        assert.equal( $.cleanup($.textById('value')), "Veal" );
        done();
    });

    Test.should('Allow alternate watch paths').using(
        `<div id='value' g-text='value < watch'></div>`
    ).in((done, $) => {
        var data = { value: "Veal", watch: 0 };
        new Gobo({ watch: watch }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "Veal" );

        data.value = "Lug";
        assert.equal( $.cleanup($.textById('value')), "Veal" );

        data.watch += 1;
        assert.equal( $.cleanup($.textById('value')), "Lug" );

        done();
    });

    Test.should('Allow multiple watch paths').using(
        `<div id='value' g-text='fullname < first < last'></div>`
    ).in((done, $) => {
        var data = {
            fullname: () => { return data.first + " " + data.last; },
            first: "Veal",
            last: "Steakface"
        };
        new Gobo({ watch: watch }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "Veal Steakface" );

        data.first = "Lug";
        assert.equal( $.cleanup($.textById('value')), "Lug Steakface" );

        data.last = "ThickNeck";
        assert.equal( $.cleanup($.textById('value')), "Lug ThickNeck" );

        done();
    });

    Test.should('Support bi-directional filters').using(
        `<input id='value' g-value='value | one | two | three'>`
    ).in((done, $) => {
        var data = { value: "Veal", };
        var gobo = new Gobo({ watch: watch });

        gobo.filters.one = {
            read: (value) => { return "1" + value; },
            publish: (value) => { return "one " + value; }
        };
        gobo.filters.two = str => { return "2" + str };
        gobo.filters.three = {
            read: (value) => { return "3" + value; },
            publish: (value) => { return "three " + value; }
        };

        gobo.bind($.body, data);
        assert.equal( $.fieldById('value').value, "321Veal" );
        assert.equal( data.value, "Veal" );

        $.typeInto('value', "Lug");
        assert.equal( $.fieldById('value').value, "321one three Lug" );
        assert.equal( data.value, "one three Lug" );

        done();
    });

    Test.should('Watch for changes to filter arguments').using(
        `<div id='value' g-text='alpha | multiply beta gamma'></div>`
    ).in((done, $) => {
        var data = { alpha: 2, beta: 3, gamma: 4 };
        var gobo = new Gobo({ watch: watch });
        gobo.filters.multiply = (a, b, c) => { return a * b * c; };
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "24" );

        data.beta = 4;
        assert.equal( $.cleanup($.textById('value')), "32" );

        data.gamma = 5;
        assert.equal( $.cleanup($.textById('value')), "40" );

        done();
    });

});
