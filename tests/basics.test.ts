/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Gobo', (should) => {

    should('call functions to resolve values').using(
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

    should('return nested data').using(
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

    should('update the dom when a value changes').using(
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

        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        data.firstname = "Big";
        data.person = { name: { last: "McLargeHuge" } };
        assert.equal( $.cleanup($.textById('name')), "Big McLargeHuge" );

        data.person.name.last = "LugWrench";
        assert.equal( $.cleanup($.textById('name')), "Big LugWrench" );

        done();
    });

    should('sort directives by priority').using(
        `<ul>
            <li g-three='junk' g-one='junk' g-final='junk' g-two='junk'>
            </li>
        </ul>`
    ).in((done, $) => {
        var gobo = new Gobo();

        var count = 0;

        gobo.directives.one = Gobo.directive({
            priority: 500,
            execute: ( value: any ) => { assert.equal(count++, 0); }
        });

        gobo.directives.two = Gobo.directive({
            priority: 250,
            execute: ( value: any ) => { assert.equal(count++, 1); }
        });

        gobo.directives.three = Gobo.directive({
            priority: 50,
            execute: ( value: any ) => { assert.equal(count++, 2); }
        });

        gobo.directives.final = Gobo.directive({
            execute: ( value: any ) => { assert.equal(count++, 3); }
        });

        gobo.bind( $.body, { junk: "blah" });

        assert.equal(4, count);

        done();
    });

    should('Respect priorities across different elements').using(
        `<div g-three='junk'>
            <div g-one='junk'>
                <div g-final='junk'></div>
            </div>
            <div g-two='junk'></div>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo();

        var count = 0;

        gobo.directives.one = Gobo.directive({
            priority: 500,
            execute: ( value: any ) => { assert.equal(count++, 0); }
        });

        gobo.directives.two = Gobo.directive({
            priority: 250,
            execute: ( value: any ) => { assert.equal(count++, 1); }
        });

        gobo.directives.three = Gobo.directive({
            priority: 50,
            execute: ( value: any ) => { assert.equal(count++, 2); }
        });

        gobo.directives.final = Gobo.directive({
            execute: ( value: any ) => { assert.equal(count++, 3); }
        });

        gobo.bind( $.body, { junk: "blah" });

        assert.equal(4, count);

        done();
    });

    should('allow bindings on the root element').using(
        `<div id='name' g-text='name'></div>`
    ).in((done, $) => {
        new Gobo().bind( $.byId('name'), { name: "Jack" });
        assert.equal( $.textById('name'), "Jack" );
        done();
    });

});

