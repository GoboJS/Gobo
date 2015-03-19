/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Expressions', (should) => {

    should('support keypaths with single quotes').using(
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

    should('support keypaths with double quotes').using(
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

    should('strip leading dots off keypaths').using(
        `<div id='value'>
            <div g-text='."key with spaces"'></div>
        </div>`
    ).in((done, $) => {
        new Gobo().bind($.body, { "key with spaces": "Veal Steakface" });
        assert.equal( $.cleanup($.textById('value')), "Veal Steakface" );
        done();
    });

    should('allow filtering').using(
        `<div>
            <span id='one' g-text='name | one'></span>
            <span id='two' g-text='name | one | two'></span>
            <span id='three' g-text='name | one | two | three'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: WatchJS });

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

    should('pass arguments to filter').using(
        `<div>
            <span g-text='input | keywords true false null undefined'></span>
            <span g-text='input | literals "some string" 10 4.5'></span>
            <span g-text='input | variable input some.thing'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: WatchJS });

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

    should('bind persistent scratchpads to filters').using(
        `<div>
            <span g-text='one | scratch'></span>
            <span g-text='two | scratch'></span>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: WatchJS });

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

    should('pass arguments').using(
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

    should('not call values that arent functions').using(
        `<div id='value' g-text='input true false'></div>`
    ).in((done, $) => {
        new Gobo().bind($.body, { input:  "Veal" });
        assert.equal( $.cleanup($.textById('value')), "Veal" );
        done();
    });

    should('Allow alternate watch paths').using(
        `<div id='value' g-text='value < alternate'></div>`
    ).in((done, $) => {

        var i = 0;
        var data = {
            value: () => {
                i++;
                return i;
            },
            alternate: 0
        };

        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "1" );

        data.alternate += 1;
        assert.equal( $.cleanup($.textById('value')), "2" );

        data.alternate += 1;
        assert.equal( $.cleanup($.textById('value')), "3" );

        done();
    });

    should('Only trigger once when connecting').using(
        `<ul>
            <li g-test="path arg < monitor"></li>
        </ul>`
    ).in((done, $) => {
        var gobo = new Gobo();

        var calls = 0;
        gobo.directives.test = Gobo.directive(() => { calls++; });
        gobo.bind( $.body, {});

        assert.equal(calls, 1);
        done();
    });

    should('Watch for changes on a keypath despite a watch path').using(
        `<div id='value' g-text='value < alternate'></div>`
    ).in((done, $) => {
        var data = { value: "Veal", alternate: 0 };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "Veal" );

        data.value = "Lug";
        assert.equal( $.cleanup($.textById('value')), "Lug" );

        done();
    });

    should('Allow multiple watch paths').using(
        `<div id='value' g-text='fullname < first < last'></div>`
    ).in((done, $) => {
        var data = {
            fullname: () => { return data.first + " " + data.last; },
            first: "Veal",
            last: "Steakface"
        };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "Veal Steakface" );

        data.first = "Lug";
        assert.equal( $.cleanup($.textById('value')), "Lug Steakface" );

        data.last = "ThickNeck";
        assert.equal( $.cleanup($.textById('value')), "Lug ThickNeck" );

        done();
    });

    should('Support bi-directional filters').using(
        `<input id='value' g-model='value | one | two | three'>`
    ).in((done, $) => {
        var data = { value: "Veal", };
        var gobo = new Gobo({ watch: WatchJS });

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

    should('Support publish only filters').using(
        `<input id='value' g-model='value | one | two'>`
    ).in((done, $) => {
        var data = { value: "Veal", };
        var gobo = new Gobo({ watch: WatchJS });

        gobo.filters.one = {
            publish: (value) => { return "one " + value; }
        };
        gobo.filters.two = {
            publish: (value) => { return "two " + value; }
        };

        gobo.bind($.body, data);
        assert.equal( $.fieldById('value').value, "Veal" );
        assert.equal( data.value, "Veal" );

        $.typeInto('value', "Lug");
        assert.equal( $.fieldById('value').value, "one two Lug" );
        assert.equal( data.value, "one two Lug" );

        done();
    });

    should('Watch for changes to filter arguments').using(
        `<div id='value' g-text='alpha | multiply beta gamma'></div>`
    ).in((done, $) => {
        var data = { alpha: 2, beta: 3, gamma: 4 };
        var gobo = new Gobo({ watch: WatchJS });
        gobo.filters.multiply = (a, b, c) => { return a * b * c; };
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "24" );

        data.beta = 4;
        assert.equal( $.cleanup($.textById('value')), "32" );

        data.gamma = 5;
        assert.equal( $.cleanup($.textById('value')), "40" );

        done();
    });

    should('Allow primitives to be passed directly to directives').using(
        `<ul id='values'>
            <li g-text='undefined'></li>
            <li g-text='null'></li>
            <li g-text='true'></li>
            <li g-text='false'></li>
            <li g-text='3.14'></li>
            <li g-text='"some string"'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {});

        assert.equal(
            $.cleanup($.textById('values')),
            "true false 3.14 some string"
        );

        done();
    });

    should('Publish to alternate locations').using(
        `<input id='field' g-model='name > other'>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface", other: "Nothing" };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( data.other, "Nothing" );
        assert.equal( data.name, "Veal Steakface" );

        $.typeInto('field', "Lug ThickNeck");

        assert.equal( data.other, "Lug ThickNeck" );
        assert.equal( data.name, "Veal Steakface" );

        done();
    });

    should('Apply filters when publishing to an alternate location').using(
        `<input id='field' g-model='name > other | one | two'>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface", other: "Nothing" };
        var gobo = new Gobo({ watch: WatchJS });

        gobo.filters.one = {
            read: (value) => { return value; },
            publish: (value) => { return "one " + value; }
        };
        gobo.filters.two = {
            read: (value) => { return value; },
            publish: (value) => { return "two " + value; }
        };

        gobo.bind($.body, data);

        assert.equal( data.other, "Nothing" );
        assert.equal( data.name, "Veal Steakface" );

        $.typeInto('field', "Lug ThickNeck");

        assert.equal( data.other, "one two Lug ThickNeck" );
        assert.equal( data.name, "Veal Steakface" );

        done();
    });

    should('Ignore new lines').using(
        `<input id='field' g-model='
                keypath
                    > destination
                    | filter
                        "Filter"
                    < monitor
                '>`
    ).in((done, $) => {
        var data = { keypath: "Steakface", monitor: 0, destination: null };
        var gobo = new Gobo({ watch: WatchJS });

        gobo.filters.filter = (arg, value) => { return arg + " " + value; };

        gobo.bind($.body, data);

        assert.equal( $.fieldById('field').value, "Steakface Filter" );

        $.typeInto('field', "Lug");

        assert.equal( data.destination, "Lug" );

        done();
    });

    should('Treat empty expressions as undefined').using(
        `<ul>
            <li g-test></li>
            <li g-test=""></li>
            <li g-test="   "></li>
            <li g-test=" < monitor"></li>
            <li g-test=" < "></li>
            <li g-test=" > publish"></li>
            <li g-test=" > "></li>
        </ul>`
    ).in((done, $) => {
        var gobo = new Gobo();

        gobo.directives.test = Gobo.directive(function (elem, value) {
            assert.isUndefined(value);
            this.publish("test");
        });

        gobo.bind($.body, {});
        done();
    });

});
