/// <reference path="test-help.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var Gobo = require("../gobo.debug.js").Gobo;
var watch = require("watchjs");

describe('Gobo', function () {

    Test.should('bind values to text content').using(
        `<ul>
            <li>
                <span>Name:</span>
                <span g-text="name" id='name' class='bold'></span>
            </li>
            <li>
                <span>Age:</span>
                <span g-text="age" id='age' class='subtle'></span>
            </li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind( $.body, {
            name: "Jack",
            age: 31
        });
        assert.equal( $.textById('name'), "Jack" );
        assert.equal( $.textById('age'), "31" );
        done();
    });

    Test.should('call functions to resolve values').using(
        `<ul>
            <li g-text="name" id='name' class='bold'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind( $.body, {
            name: () => { return "Jack" }
        });
        assert.equal( $.textById('name'), "Jack" );
        done();
    });

    Test.should('return nested data').using(
        `<ul>
            <li id='name'>
                <span g-text="person.name.first"></span>
                <span g-text="person.name.last"></span>
            </li>
            <li g-text="person.age" id='age'></li>
            <li g-text="person.hair.color" id='hair-color'></li>
            <li g-text="person.shoesize" id='shoes'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind( $.body, {
            person: {
                name: {
                    first: "Veal",
                    last: "Steakface"
                },
                age: 43
            }
        });
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );
        assert.equal( $.textById('age'), "43" );
        assert.equal( $.textById('hair-color'), "" );
        assert.equal( $.textById('shoes'), "" );
        done();
    });

    Test.should('update the dom when a value changes').using(
        `<ul>
            <li id='name'>
                <span g-text="firstname"></span>
                <span g-text="person.name.last"></span>
            </li>
        </ul>`
    ).in((done, $) => {
        var data = {
            firstname: "Veal",
            person: { name: { last: "Steakface" } }
        };

        new Gobo({ watch: watch }).bind($.body, data);
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        data.firstname = "Big";
        data.person = { name: { last: "McLargeHuge" } };
        assert.equal( $.cleanup($.textById('name')), "Big McLargeHuge" );

        data.person.name.last = "LugWrench";
        assert.equal( $.cleanup($.textById('name')), "Big LugWrench" );

        done();
    });

    Test.should('add and remove classes').using(
        `<ul>
            <li id='elem' g-class-active='activated'></li>
        </ul>`
    ).in((done, $) => {
        var data = { activated: true };

        new Gobo({ watch: watch }).bind($.body, data);
        assert.isTrue( $.hasClass($.byId('elem'), 'active') );

        data.activated = false;
        assert.equal( false, $.hasClass($.byId('elem'), 'active') );

        data.activated = true;
        assert.isTrue( $.hasClass($.byId('elem'), 'active') );

        done();
    });


    Test.should('sort directives by priority').using(
        `<ul>
            <li g-three='junk' g-one='junk' g-final='junk' g-two='junk'>
            </li>
        </ul>`
    ).in((done, $) => {
        var gobo = new Gobo();

        var count = 0;

        gobo.directives.one = Gobo.directive({
            priority: 500,
            execute: ( value: any ) => { assert.equal(0, count++); }
        });

        gobo.directives.two = Gobo.directive({
            priority: 250,
            execute: ( value: any ) => { assert.equal(1, count++); }
        });

        gobo.directives.three = Gobo.directive({
            priority: 50,
            execute: ( value: any ) => { assert.equal(2, count++); }
        });

        gobo.directives.final = Gobo.directive({
            execute: ( value: any ) => { assert.equal(3, count++); }
        });

        gobo.bind( $.body, { junk: "blah" });

        assert.equal(4, count);

        done();
    });

    Test.should('allow bindings on the root element').using(
        `<div id='name' g-text='name'></div>`
    ).in((done, $) => {
        new Gobo().bind( $.byId('name'), { name: "Jack" });
        assert.equal( $.textById('name'), "Jack" );
        done();
    });

    Test.should('Hide and show elements').using(
        `<ul>
            <li id='shown' g-show='bool'></li>
            <li id='hidden' g-hide='bool'></li>
        </ul>`
    ).in((done, $) => {
        var data = { bool: true };
        new Gobo({ watch: watch }).bind($.body, data);

        assert.isTrue( $.isVisible('shown') );
        assert.isFalse( $.isVisible('hidden') );

        data.bool = false;
        assert.isTrue( $.isVisible('hidden') );
        assert.isFalse( $.isVisible('shown') );

        done();
    });

});

