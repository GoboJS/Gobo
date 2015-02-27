/// <reference path="test-help.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var Gobo = require("../gobo.debug.js").Gobo;
var watch = require("watchjs");

describe('Value directives', function () {

    Test.should('Set the value of an input field').using(
        `<input id='field' g-value='name'>`
    ).in((done, $) => {
        new Gobo({ watch: watch }).bind($.body, { name: "Veal Steakface" });
        assert.equal( $.fieldById('field').value, "Veal Steakface" );
        done();
    });

    Test.should('Update the data when the value changes').using(
        `<input id='field' g-value='name'>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface" };
        new Gobo({ watch: watch }).bind($.body, data);
        $.typeInto('field', "Lug ThickNeck");
        assert.equal( data.name, "Lug ThickNeck" );
        done();
    });

});


