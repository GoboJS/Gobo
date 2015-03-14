Gobo [![Build Status](https://secure.travis-ci.org/Nycto/Gobo.png?branch=master)](http://travis-ci.org/Nycto/Gobo)
====

Gobo projects your data onto your DOM. It's a small MVVM library for binding
data to HTML; you provide the model, then write attributes in your HTML that
describe the user experience. Gobo glues them together.

![Sauce Test Status](https://saucelabs.com/browser-matrix/nycto-gobo.svg?auth=35717a653e612001e0b36828bcb06a24)

MVVM?
-----

MVVM is a specific variant of MV\*. It stands for
[Model/View/View Model](http://en.wikipedia.org/wiki/Model_View_ViewModel).
`Models` are exactly what you would expect: your data. In the case of Gobo, the
the `View` is your DOM. Gobo then acts as the `View Model`, which glues your
model and view together.

How does it work?
-----------------

When you initialize a Gobo instance, it scans the DOM for directives. These
directives describe behavior using DOM attributes. For example, you might see
`<span g-text='name'></span>`, which will set the text content of that span
element to the variable `name`.

Then, Gobo will watch for changes to your data and update the DOM automatically.

FAQ
---

### Why not allow Mustache syntax? Or, why only allow attribute directives?

If you haven't used Mustache, it's a templating language for javascript that
uses curly braces to embed data into HTML.

For DOM binding libraries like Gobo, this has the unfortunate side effect
of encouring flashes of unstyled content. This happens when a user is initally
loading a page and the JavaScript hasn't been downloaded yet; they will see
the curly braces and the code used for generating content. This is a terrible
user experience.

By only allowing attribute based directives, you can guarantee that a user
will see blank content instead of seeing code. In fact, you could even render
an initial view on the server and then seamlessly hook in Gobo on the client.

### How is this different from Rivets?

Gobo took (stole?) a lot of inspiration from Rivets. The big differences are:

1. Gobo doesn't support Mustache style binding
2. The data watching model is a lot more flexible in Gobo. You have complete
   control over how the view binds to the model. This makese it easier to
   integrate with libraries like Backbone or Stapes.
3. You can pass arguments to values. This makes a huge difference when building
   an interface to add or remove values from a list.

### How is this different from Angular?

It's a whole heck of a lot lighter weight. Angular is a full framework, while
Gobo is really just a way to watch data and automatically update your DOM.

### How is this different from Ractive?

Ractive uses string based templates, while Gobo uses the DOM and attribute
bindings.

### How is this different from Vue?

Vue is very rigid about how it observes your data. You are basically forced to
use plain old JavaScript objects, which doesn't work too well when you want to
watch for changes on a Backbone model.

### How is this different from Knockout?

Gobo is a lot less invasive into your model. Knockout requires hooks (like
`ko.observable` and `ko.computed`); Gobo doesn't need that.

License
-------

Gobo is released under the MIT License, which is pretty spiffy. You should
have received a copy of the MIT License along with this program. If not, see
http://www.opensource.org/licenses/mit-license.php

