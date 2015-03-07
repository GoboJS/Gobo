/// <reference path="test-help.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;
declare var describe: (string, any) => void;

var assert = require('chai').assert;
var watch = require("watchjs");

describe('On-event directives', function () {

    Test.should('call functions').using(
        `<a href='#' id='link' g-on-click='execute'>Click me</a>`
    ).in((done, $) => {
        var data = { execute: done };
        new Gobo({ watch: watch }).bind($.body, data);
        $.clickById('link');
    });

    Test.should('Disable events when disabled').using(
        `<div g-if='active'>
            <a href='#' id='link' g-on-click='execute'>Click me</a>
        </div>`
    ).in((done, $) => {

        var count = 0;
        var data = {
            execute() { count++; },
            active: true
        };

        new Gobo({ watch: watch }).bind($.body, data);

        var elem = $.byId('link');
        $.click(elem);

        data.active = false;
        $.click(elem);
        $.click(elem);

        data.active = true;
        $.click(elem);

        assert.equal(count, 2);
        done();
    });

});

