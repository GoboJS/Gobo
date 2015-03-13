/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Default Directives', (should) => {

    should('bind values to text content').using(
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

    should('add and remove classes').using(
        `<ul>
            <li id='elem' g-class-active='activated'></li>
        </ul>`
    ).in((done, $) => {
        var data = { activated: true };

        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.isTrue( $.hasClass($.byId('elem'), 'active') );

        data.activated = false;
        assert.equal( false, $.hasClass($.byId('elem'), 'active') );

        data.activated = true;
        assert.isTrue( $.hasClass($.byId('elem'), 'active') );

        done();
    });

    should('Remove prexisting classes').using(
        `<ul>
            <li id='elem' class='klazz' g-class-klazz='enabled'></li>
        </ul>`
    ).in((done, $) => {
        var data: any = { enabled: true };

        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.isTrue( $.hasClass($.byId('elem'), 'klazz') );

        data.enabled = true;
        assert.isTrue( $.hasClass($.byId('elem'), 'klazz') );

        data.enabled = false;
        assert.isFalse( $.hasClass($.byId('elem'), 'klazz') );

        done();
    });

    should('Hide and show elements').using(
        `<ul>
            <li id='shown' g-show='bool'></li>
            <li id='hidden' g-hide='bool'></li>
        </ul>`
    ).in((done, $) => {
        var data = { bool: true };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.isTrue( $.isVisible('shown') );
        assert.isFalse( $.isVisible('hidden') );

        data.bool = false;
        assert.isTrue( $.isVisible('hidden') );
        assert.isFalse( $.isVisible('shown') );

        done();
    });

    should('Set and unset attributes').using(
        `<ul>
            <li id='elem' g-some-attr='key'></li>
        </ul>`
    ).in((done, $) => {
        var data: any = {};
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.isFalse( $.byId('elem').hasAttribute("some-attr") );

        data.key = 'blah';
        assert.equal($.byId('elem').getAttribute("some-attr"), 'blah');

        data.key = false;
        assert.isFalse( $.byId('elem').hasAttribute("some-attr") );

        done();
    });

});


