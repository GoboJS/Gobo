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

});

