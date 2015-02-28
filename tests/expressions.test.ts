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

        gobo.filters.one = Gobo.filter(str => { return "1" + str });
        gobo.filters.two = Gobo.filter(str => { return "2" + str });
        gobo.filters.three = Gobo.filter(str => { return "3" + str });

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

        gobo.filters.keywords = Gobo.filter((value, t, f, n, u) => {
            assert.isTrue(t);
            assert.isFalse(f);
            assert.isNull(n);
            assert.isUndefined(u);
        });

        gobo.filters.literals = Gobo.filter((value, s, i, f) => {
            assert.equal(s, "some string");
            assert.equal(i, 10);
            assert.equal(f, 4.5);
        });

        gobo.filters.variable = Gobo.filter((value, one, two) => {
            assert.equal(one, "Veal");
            assert.equal(two, "wakka wakka");
        });

        gobo.bind($.body, { input: "Veal", some: { thing: "wakka wakka" } });

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

    Test.should('Disallow multiple watch paths').using(
        `<div id='value' g-text='value < watch < another'></div>`
    ).in((done, $) => {
        assert.throws(() => {
            new Gobo().bind($.body, { value: "Veal", watch: 0 });
        });

        done();
    });

    Test.should('support comparison operators').using(
        `<ul id='eq'>
            <li g-if='five | eq 5'>eq 5</li>
            <li g-if='five | eq 6'>eq 6</li>
        </ul>
        <ul id='lt'>
            <li g-if='five | lt 6'>lt 6</li>
            <li g-if='five | lt 5'>lt 5</li>
            <li g-if='five | lt 4'>lt 4</li>
        </ul>
        <ul id='lte'>
            <li g-if='five | lte 6'>lte 6</li>
            <li g-if='five | lte 5'>lte 5</li>
            <li g-if='five | lte 4'>lte 4</li>
        </ul>
        <ul id='gt'>
            <li g-if='five | gt 6'>gt 6</li>
            <li g-if='five | gt 5'>gt 5</li>
            <li g-if='five | gt 4'>gt 4</li>
        </ul>
        <ul id='gte'>
            <li g-if='five | gte 6'>gte 6</li>
            <li g-if='five | gte 5'>gte 5</li>
            <li g-if='five | gte 4'>gte 4</li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, { five: 5 });

        assert.equal( $.cleanup($.textById('eq')), "eq 5" );
        assert.equal( $.cleanup($.textById('lt')), "lt 6" );
        assert.equal( $.cleanup($.textById('lte')), "lte 6 lte 5" );
        assert.equal( $.cleanup($.textById('gt')), "gt 4" );
        assert.equal( $.cleanup($.textById('gte')), "gte 5 gte 4" );

        done();
    });

});
