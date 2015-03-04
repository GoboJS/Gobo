/// <reference path="test-help.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var Gobo = require("../gobo.debug.js").Gobo;
var watch = require("watchjs");

describe('Components', function () {

    Test.should('Be creatable from strings').using(
        `<div id='container'>
            <g-widget></g-widget>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo();

        gobo.components.widget = Gobo.component("<div>Veal Steakface</div>");

        gobo.bind($.body, {});
        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        done();
    });

    Test.should('Throw if a widget isnt recognized').using(
        `<div id='container'>
            <g-widget></g-widget>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo();
        assert.throws(() => {
            gobo.bind($.body, {});
        });
        done();
    });

    Test.should('Bind to directives within a component').using(
        `<div id='container'>
            <g-widget></g-widget>
        </div>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface" };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = Gobo.component("<div g-text='name'></div>");
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        data.name = "Lug ThickNeck";

        assert.equal( $.cleanup($.textById('container')), "Lug ThickNeck" );

        done();
    });

    Test.should('Allow directives directly on a component').using(
        `<div>
            <g-widget g-text='name'></g-widget>
        </div>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface", active: true };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = Gobo.component(
            "<div id='container' g-class-highlight='active'></div>"
        );
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        assert.isTrue( $.hasClass($.byId('container'), "highlight") );

        data.name = "Lug ThickNeck";
        assert.equal( $.cleanup($.textById('container')), "Lug ThickNeck" );

        data.active = false;
        assert.isFalse( $.hasClass($.byId('container'), "highlight") );

        done();
    });

});


