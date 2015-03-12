/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Value directives', (should) => {

    should('Set the value of an input field').using(
        `<input id='field' g-value='name'>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface" };
        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.equal( $.fieldById('field').value, "Veal Steakface" );

        data.name = "Lug ThickNeck";
        assert.equal( $.fieldById('field').value, "Lug ThickNeck" );

        done();
    });

    should('Update the data when the value changes').using(
        `<input id='field' g-value='name'>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface" };
        new Gobo({ watch: WatchJS }).bind($.body, data);
        $.typeInto('field', "Lug ThickNeck");
        assert.equal( data.name, "Lug ThickNeck" );
        done();
    });

    should('Update a keypath when the value changes').using(
        `<input id='field' g-value='person.details.name'>`
    ).in((done, $) => {
        var data = { person: { details: { name: "Veal Steakface" } } };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        $.typeInto('field', "Lug ThickNeck");
        assert.equal( data.person.details.name, "Lug ThickNeck" );

        $.typeInto('field', "Big McLargeHuge");
        assert.equal( data.person.details.name, "Big McLargeHuge" );

        done();
    });

    should('Set the value of a select field').using(
        `<select id='field' g-value='name'>
            <option>Lug</option>
            <option>Veal</option>
            <option>Big</option>
        </select>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, { name: "Veal" });
        assert.equal( $.fieldById('field').value, "Veal" );
        done();
    });

    should('Call functions when publishing values').using(
        `<input id='field' g-value='name'>`
    ).in((done, $) => {

        new Gobo({ watch: WatchJS }).bind($.body, {
            name: function () {
                if ( arguments.length === 0 ) {
                    return "Veal Steakface";
                }
                else {
                    assert.equal( arguments[0], "Lug ThickNeck" );
                    done();
                }
            }
        });

        assert.equal( $.fieldById('field').value, "Veal Steakface" );

        $.typeInto('field', "Lug ThickNeck");
    });

    should('publish as a final value to functions with arguments').using(
        `<input id='field' g-value='name "one" "two"'>`
    ).in((done, $) => {

        new Gobo({ watch: WatchJS }).bind($.body, {
            name: function (one, two, value) {
                assert.equal( one, "one" );
                assert.equal( two, "two" );
                if ( arguments.length === 2 ) {
                    return "Veal Steakface";
                }
                else {
                    assert.equal( value, "Lug ThickNeck" );
                    done();
                }
            }
        });

        assert.equal( $.fieldById('field').value, "Veal Steakface" );

        $.typeInto('field', "Lug ThickNeck");
    });
});

