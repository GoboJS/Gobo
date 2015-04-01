/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('With directives', (should) => {

    should('Set variables').using(
        `<div id='value' g-with-name='person.name' g-with-str='"Esq."'>
            <span g-text="name"></span> <span g-text="str"></span>
        </div>`
    ).in((done, $) => {

        new Gobo().bind($.body, { person: { name: "Lug ThickNeck" } });

        assert.equal( $.cleanup($.textById('value')), "Lug ThickNeck Esq." );

        done();
    });

    should('bind to the original expression').using(
        `<div id='value' g-with-name='person.name'>
            <span g-text="name.first"></span> <span g-text="name.last"></span>
        </div>`
    ).in((done, $) => {
        var data = { person: { name: { first: "Lug", last: "ThickNeck" } } };

        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "Lug ThickNeck" );

        data.person.name.first = "Big";
        assert.equal( $.cleanup($.textById('value')), "Big ThickNeck" );

        data.person.name.last = "McLargeHuge";
        assert.equal( $.cleanup($.textById('value')), "Big McLargeHuge" );

        data.person = { name: { first: "Veal", last: "Steakface" } };
        assert.equal( $.cleanup($.textById('value')), "Veal Steakface" );

        done();
    });

    should('Allow filters in the bound expression').using(
        `<div id='value' g-with-name='person.name | lowercase'>
            <span g-text="name"></span>
        </div>`
    ).in((done, $) => {
        var data = { person: { name: "Lug ThickNeck" } };

        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('value')), "lug thickneck" );

        data.person.name = "Big McLargeHuge";
        assert.equal( $.cleanup($.textById('value')), "big mclargehuge" );

        done();
    });

    should('Publish through a scope').using(
        `<div>
            <div g-with-name='person.name' g-publish='name'></div>
            <div g-with-lug='person' g-publish='lug.title'></div>
            <div g-with-name='robot.name | knight' g-publish='name'></div>
        </div>`
    ).in((done, $) => {
        var data = {
            person: {
                name: "Lug ThickNeck",
                title: "Esq."
            },
            robot: {
                name: "Crow"
            }
        };

        var gobo = new Gobo();

        gobo.directives.publish = Gobo.directive(function (elem, value) {
            this.publish( value.toUpperCase() );
        });

        gobo.filters.knight = { publish: (name) => { return "Sir " + name; } };

        gobo.bind($.body, data);

        assert.equal( data.person.name, "LUG THICKNECK" );
        assert.equal( data.person.title, "ESQ." );
        assert.equal( data.robot.name, "Sir CROW" );

        done();
    });
});

