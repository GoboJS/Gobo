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

});
