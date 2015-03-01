/// <reference path="test-help.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var Gobo = require("../gobo.debug.js").Gobo;
var watch = require("watchjs");

describe('Filters', function () {

    Test.should('convert to upper and lower case').using(
        `<div>
            <span id='upper' g-text='name | uppercase'></span>
            <span id='lower' g-text='name | lowercase'></span>
        </div>`
    ).in((done, $) => {
        new Gobo({ watch: watch }).bind($.body, { name: "Veal" });
        assert.equal( $.cleanup($.textById('upper')), "VEAL" );
        assert.equal( $.cleanup($.textById('lower')), "veal" );
        done();
    });

    Test.should('Invert a truthy value').using(
        `<div>
            <span id='not' g-if='active | not'>VISIBLE</span>
        </div>`
    ).in((done, $) => {
        var data = { active: false };
        new Gobo({ watch: watch }).bind($.body, data);

        assert.equal( $.cleanup($.textById('not')), "VISIBLE" );

        data.active = true;
        assert.isFalse( $.idExists('not') );

        done();
    });

    Test.should('Limit the values of an array').using(
        `<ul id='looped'>
            <li g-each-name='names | limit 2' g-text='name'></li>
        </li>`
    ).in((done, $) => {
        var data = { names: [ "Veal ", "Lug ", "Big " ] };
        new Gobo({ watch: watch }).bind($.body, data);

        assert.equal( $.cleanup($.textById('looped')), "Veal Lug" );

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

