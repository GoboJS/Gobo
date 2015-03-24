/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Directives', (should) => {

    should('Call connect, execute and disconnect in a specific order').using(
        `<ul g-if='enabled'>
            <li g-test></li>
        </ul>`
    ).in((done, $) => {
        var gobo = new Gobo({ watch: WatchJS });

        var previous;
        gobo.directives.test = Gobo.directive({
            connect: () => {
                assert.isUndefined(previous);
                previous = "connect";
            },
            execute: () => {
                assert.equal(previous, "connect");
                previous = "execute";
            },
            disconnect: () => {
                assert.equal(previous, "execute");
                previous = "disconnect";
            },
        });

        var data = { enabled: true };
        gobo.bind($.body, data);
        data.enabled = false;

        assert.equal(previous, "disconnect");

        done();
    });

    should('Allow "allowFunc" to be set').using(
        `<div g-test='func'></div>`
    ).in((done, $) => {
        var gobo = new Gobo();

        gobo.directives.test = Gobo.directive({
            allowFuncs: true,
            execute: (value) => {
                assert.isFunction(value);
                done();
            }
        });

        var data = { func: () => { return "Should be a function"; } };
        gobo.bind($.body, data);
    });

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


