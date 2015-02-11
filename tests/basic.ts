declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('assert');
var Gobo = require("../../gobo.debug.js").Gobo;
var Test = require("./test-help.js").Tester;
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
        new Gobo({ document: $.document }).bind( $.body, {
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
        new Gobo({ document: $.document }).bind( $.body, {
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
        new Gobo({ document: $.document }).bind( $.body, {
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

        new Gobo({ document: $.document, watch: watch }).bind($.body, data);
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        data.firstname = "Big";
        data.person = { name: { last: "McLargeHuge" } };
        assert.equal( $.cleanup($.textById('name')), "Big McLargeHuge" );

        data.person.name.last = "LugWrench";
        assert.equal( $.cleanup($.textById('name')), "Big LugWrench" );

        done();
    });

});

