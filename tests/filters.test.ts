/// <reference path="framework/framework.ts"/>
/// <reference path="../src/gobo.ts"/>

declare var require: (string) => any;

var assert = require('chai').assert;
var WatchJS = require("watchjs");

Test.test('Filters', (should) => {

    should('convert to upper and lower case').using(
        `<div>
            <span id='upper' g-text='name | uppercase'></span>
            <span id='lower' g-text='name | lowercase'></span>
        </div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, { name: "Veal" });
        assert.equal( $.cleanup($.textById('upper')), "VEAL" );
        assert.equal( $.cleanup($.textById('lower')), "veal" );
        done();
    });

    should('Invert a truthy value').using(
        `<div>
            <span id='not' g-if='active | not'>VISIBLE</span>
        </div>`
    ).in((done, $) => {
        var data = { active: false };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('not')), "VISIBLE" );

        data.active = true;
        assert.isFalse( $.idExists('not') );

        done();
    });

    should('Limit the values of an array').using(
        `<ul id='looped'>
            <li g-each-name='names | limit 2' g-text='name'></li>
        </ul>`
    ).in((done, $) => {
        var data = { names: [ "Veal ", "Lug ", "Big " ] };
        new Gobo({ watch: WatchJS }).bind($.body, data);

        assert.equal( $.cleanup($.textById('looped')), "Veal Lug" );

        done();
    });

    should('support comparison operators').using(
        `<ul id='eq'>
            <li g-if='five | eq 5'>eq 5</li>
            <li g-if='five | eq 6'>eq 6</li>
        </ul>
        <ul id='lt'>
            <li g-if='five | lt 6'>lt 6</li>
            <li g-if='five | lt 5'>lt 5</li>
            <li g-if='five | lt 4'>lt 4</li>
        </ul>
        <ul id='lte'>
            <li g-if='five | lte 6'>lte 6</li>
            <li g-if='five | lte 5'>lte 5</li>
            <li g-if='five | lte 4'>lte 4</li>
        </ul>
        <ul id='gt'>
            <li g-if='five | gt 6'>gt 6</li>
            <li g-if='five | gt 5'>gt 5</li>
            <li g-if='five | gt 4'>gt 4</li>
        </ul>
        <ul id='gte'>
            <li g-if='five | gte 6'>gte 6</li>
            <li g-if='five | gte 5'>gte 5</li>
            <li g-if='five | gte 4'>gte 4</li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, { five: 5 });

        assert.equal( $.cleanup($.textById('eq')), "eq 5" );
        assert.equal( $.cleanup($.textById('lt')), "lt 6" );
        assert.equal( $.cleanup($.textById('lte')), "lte 6 lte 5" );
        assert.equal( $.cleanup($.textById('gt')), "gt 4" );
        assert.equal( $.cleanup($.textById('gte')), "gte 5 gte 4" );

        done();
    });

    should('Capitalize the first letter of a string').using(
        `<div id='value' g-text='name | capitalize'></div>`
    ).in((done, $) => {
        new Gobo({ watch: WatchJS }).bind($.body, { name: "veal" });
        assert.equal( $.cleanup($.textById('value')), "Veal" );
        done();
    });

    should('Allow event filtering by keycode').using(
        `<input id='value' g-on-keyup='callback | key "enter"'>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            callback: function (event) {
                assert.equal(event.keyCode, 13);
                done();
            }
        });

        $.keyup("value", 65);
        $.keyup("value", 66);
        $.keyup("value", 67);
        $.keyup("value", 13);
    });

    should('Invoke functions').using(
        `<ul>
            <li id='withoutArgs' g-text='func1 | invoke'></li>
            <li id='withArgs' g-text='func2 | invoke 1 2 "three"'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            func1: function () {
                assert.equal(arguments.length, 0);
                return "Func1 result";
            },
            func2: function () {
                assert.deepEqual( [].slice.call(arguments), [1, 2, "three"] );
                return "Func2 result";
            }
        });

        assert.equal( $.cleanup($.textById('withoutArgs')), "Func1 result" );
        assert.equal( $.cleanup($.textById('withArgs')), "Func2 result" );
        done();
    });

    should('Set a value').using(
        `<div>
            <a id='clickOne' g-on-click='obj | set "key" "value"'></li>
            <a id='clickTwo' g-on-click='obj | set "key" "other value"'></li>
        </div>`
    ).in((done, $) => {
        var data: any = { obj: {} };

        new Gobo().bind($.body, data);

        assert.isUndefined( data.obj.key );

        $.clickById("clickOne");
        assert.equal( data.obj.key, "value" );

        $.clickById("clickTwo");
        assert.equal( data.obj.key, "other value" );

        done();
    });

    should('Prepend and append values').using(
        `<div>
            <div id='prepend' g-text='name | prepend "one" "two"'></div>
            <div id='apppend' g-text='name | append "one" "two"'></div>
        </div>`
    ).in((done, $) => {
        new Gobo().bind($.body, { name: "Lug ThickNeck" });

        assert.equal( $.cleanup($.textById('prepend')), "onetwoLug ThickNeck" );
        assert.equal( $.cleanup($.textById('apppend')), "Lug ThickNeckonetwo" );

        done();
    });

    should('Pluralize words').using(
        `<ul id='strings'>
            <li data-expect="word" g-text='"word" | pluralize 1'></li>
            <li data-expect="words" g-text='"word" | pluralize 0'></li>
            <li data-expect="words" g-text='"word" | pluralize 2'></li>
            <li data-expect="words" g-text='"word" | pluralize -1'></li>
            <li data-expect="ladies" g-text='"lady" | pluralize 2'></li>
            <li data-expect="trolleys" g-text='"trolley" | pluralize 2'></li>
            <li data-expect="witches" g-text='"witch" | pluralize 2'></li>
            <li data-expect="boxes" g-text='"box" | pluralize 2'></li>
            <li data-expect="gases" g-text='"gas" | pluralize 2'></li>
            <li data-expect="we" g-text='"I" | pluralize 2 "we"'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {});

        [].slice.call( $.byId('strings').children ).forEach((elem) => {
            assert.equal( elem.textContent, elem.getAttribute("data-expect") );
        });

        done();
    });

    should('Filter a list of strings by a search term').using(
        `<ul id='values'>
            <li g-each-item="items | filter 'cup'" g-text='item'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            items: [
                "1 cup butter ",
                "2 cups milk ",
                "3 tbsp sugar "
            ]
        });

        assert.equal(
            $.cleanup($.textById('values')),
            "1 cup butter 2 cups milk"
        );

        done();
    });

    should('Filter a list of objects by a search term').using(
        `<ul id='values'>
            <li g-each-item="items | filter 'cup'" g-text='item.name'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            items: [
                { amount: 1, measure: "pinch", name: "salt " },
                { amount: 2, measure: "cup", name: "butter " },
                { amount: 3, measure: "tbsp", name: "sugar " },
                { amount: 4, measure: "cups", name: "milk " }
            ]
        });

        assert.equal( $.cleanup($.textById('values')), "butter milk" );

        done();
    });

    should('Filter a list of objects by a search term in a field').using(
        `<ul id='values'>
            <li g-each-item="items | filter 'u' 'name'" g-text='item.name'></li>
        </ul>`
    ).in((done, $) => {
        new Gobo().bind($.body, {
            items: [
                { amount: 1, measure: "pinch", name: "salt " },
                { amount: 2, measure: "cup", name: "butter " },
                { amount: 3, measure: "tbsp", name: "sugar " },
                { amount: 4, measure: "cups", name: "milk " }
            ]
        });

        assert.equal( $.cleanup($.textById('values')), "butter sugar" );

        done();
    });

});

