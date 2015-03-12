/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('If blocks', (should) => {

    should('detach nodes').using(
        `<ul>
            <li id='name' g-if='activated'>
                <span g-text="name.first"></span>
                <span g-text="name.last"></span>
            </li>
        </ul>`
    ).in((done, $) => {
        var data = {
            activated: true,
            name: { first: "Veal", last: "Steakface" }
        };

        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        data.activated = false;
        assert.equal( false, $.idExists('name') );

        data.name.first = "Lug";
        data.activated = true;
        assert.equal( $.cleanup($.textById('name')), "Lug Steakface" );

        data.name.last = "ThickNeck";
        assert.equal( $.cleanup($.textById('name')), "Lug ThickNeck" );

        done();
    });

    should('disconnect nested directives').using(
        `<ul>
            <li id='flag' g-if='activated'>
                <span g-custom="toggle"></span>
            </li>
        </ul>`
    ).in((done, $) => {
        var data = {
            activated: true,
            toggle: "valid string"
        };

        var calls = 0;

        var gobo = new Gobo({ watch: WatchJS });
        gobo.directives.custom = Gobo.directive((elem, value) => {
            assert.include(value, 'valid');
            calls++;
        });

        gobo.bind($.body, data);

        data.toggle = 'another valid string';
        data.activated = false;

        data.toggle = 'This should not trigger the directive';
        data.toggle = 'Neither should this';
        data.toggle = 'A return to validity';

        data.activated = true;

        assert.equal(calls, 3);

        done();
    });

    should('support nested if statements').using(
        `<ul>
            <li id='name' g-if='activated'>
                <div g-if='reallyActivated'>
                    <span g-text="name.first"></span>
                    <span g-text="name.last"></span>
                </div>
            </li>
        </ul>`
    ).in((done, $) => {
        var data = {
            activated: true,
            reallyActivated: true,
            name: { first: "Veal", last: "Steakface" }
        };

        new Gobo({ watch: WatchJS }).bind($.body, data);
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        data.reallyActivated = false;
        assert.isTrue( $.idExists('name') );
        assert.equal( $.cleanup($.textById('name')), "" );

        data.activated = false;
        assert.isFalse( $.idExists('name') );

        data.reallyActivated = true;
        assert.isFalse( $.idExists('name') );

        data.activated = true;
        assert.isTrue( $.idExists('name') );
        assert.equal( $.cleanup($.textById('name')), "Veal Steakface" );

        done();
    });

});


