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

        gobo.components.widget = "<div>Veal Steakface</div>";

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
            <g-widget person-name='name'></g-widget>
        </div>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface" };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = "<div g-text='person-name'></div>";
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        data.name = "Lug ThickNeck";

        assert.equal( $.cleanup($.textById('container')), "Lug ThickNeck" );

        done();
    });

    Test.should('Allow directives directly on a component').using(
        `<div>
            <g-widget active='active' g-text='name'></g-widget>
        </div>`
    ).in((done, $) => {
        var data = { name: "Veal Steakface", active: true };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget =
            "<div id='container' g-class-highlight='active'></div>";
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        assert.isTrue( $.hasClass($.byId('container'), "highlight") );

        data.name = "Lug ThickNeck";
        assert.equal( $.cleanup($.textById('container')), "Lug ThickNeck" );

        data.active = false;
        assert.isFalse( $.hasClass($.byId('container'), "highlight") );

        done();
    });

    Test.should('Create components directly from nodes').using(
        `<div id='container'>
            <g-widget></g-widget>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = $.create("div", "Veal Steakface");
        gobo.bind($.body, {});
        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );
        done();
    });

    Test.should('Throw when given an invalid component source').using(
        `<div id='container'>
            <g-widget></g-widget>
        </div>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = {};
        assert.throws(() => {
            gobo.bind($.body, {});
        });
        done();
    });

    Test.should('Create components from functions').using(
        `<div id='container'>
            <g-widget id='widget'></g-widget>
        </div>`
    ).in((done, $) => {
        var widget = $.byId('widget');

        var gobo = new Gobo({ watch: watch });

        gobo.components.widget = (elem) => {
            assert.equal(widget, elem);
            return "<div>Veal Steakface</div>";
        };

        gobo.bind($.body, {});

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );

        done();
    });

    Test.should('Mask data behind attributes').using(
        `<div id='container'>
            <g-widget name='veal'></g-widget>
            <g-widget></g-widget>
            <g-widget name='lug'></g-widget>
        </div>`
    ).in((done, $) => {
        var data = {
            veal: "Veal Steakface",
            lug: "Lug ThickNeck",
            name: "Not to be confused with THIS."
        };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = "<div g-text='name'></div>";
        gobo.bind($.body, data);

        assert.equal(
            $.cleanup($.textById('container')),
            "Veal Steakface Lug ThickNeck"
        );

        done();
    });

    Test.should('Allow deep attribute masking').using(
        `<div id='container'>
            <g-widget person='fake.people.veal'></g-widget>
        </div>`
    ).in((done, $) => {

        var data = { fake: { people: { veal: { name: "Veal Steakface" } } } };

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = "<div g-text='person.name'></div>";
        gobo.bind($.body, data);

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );

        data.fake.people.veal.name = "Veal McLargeHuge";
        assert.equal( $.cleanup($.textById('container')), "Veal McLargeHuge" );

        data.fake.people.veal = { name: "Veal LugNut" };
        assert.equal( $.cleanup($.textById('container')), "Veal LugNut" );

        done();
    });

    Test.should('Allow quick pass through definitions').using(
        `<div id='container'>
            <g-widget person></g-widget>
        </div>`
    ).in((done, $) => {

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = "<div g-text='person.name'></div>";
        gobo.bind($.body, { person: { name: "Veal Steakface" } });

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );

        done();
    });

    Test.should('Allow primitives to be passed to components').using(
        `<div id='container'>
            <g-widget enable="true" name="'Veal Steakface'"></g-widget>
            <g-widget enable="false" name="'Lug ThickNeck'"></g-widget>
        </div>`
    ).in((done, $) => {

        var gobo = new Gobo({ watch: watch });
        gobo.components.widget = "<div g-if='enable' g-text='name'></div>";
        gobo.bind($.body, {});

        assert.equal( $.cleanup($.textById('container')), "Veal Steakface" );

        done();
    });

});


