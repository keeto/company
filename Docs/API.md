Company API
===========

* Table of Contents
{:toc}

Unit Constructor {#Unit-Constructor}
================

Type: Unit {#Unit-Unit}
----------

The main unit constructor.

### Syntax

	new Unit(descriptor);

### Arguments

1. `descriptor` (object) - an object containing one or more properties that will be added to the properties of the unit object. Can also include special properties (see below).

### Special Properties

- `Uses` (object or array) - a set of objects to be added to the unit instance as mixins.
- `Prefix` (string) - a string that will be prepended to all message types broadcasted through `publish` (see below).
- `initSetup` (function) - a function that will be invoked immediately when the unit instance is created.
- `readySetup` (function) - a function that will be invoked upon window.ondomready.
- `loadSetup` (function) - a function that will be invoked upon window.onload.

### Returns

- (unit) a new unit instance.


Function: Unit.isUnit {#Unit-isUnit}
---------------------

Checks if an object is a unit or is unit-like.

### Syntax

	Unit.isUnit(obj);

### Arguments

1. `obj` (mixed) - the object to check.

### Returns

- (boolean) `true` if the object is a unit instance or a unit-like object, `false` if otherwise.


Function: Unit.decorate {#Unit-decorate}
-----------------------

Adds unit functionality to an object.

### Syntax

	Unit.decorate(obj, noEventWrap);

### Arguments

1. `obj` (object) - the object to decorate.
2. `noEventWrap` (boolean; optional) - if set to `true`, the `fireEvent` method of the object (if it exists) will not be wrapped. Defaults to `false`.

### Returns

- (object) the object with unit functionality.


Function: Unit.undecorate {#Unit-undecorate}
-------------------------

Removes unit functionality from an object.

### Syntax

	Unit.undecorate(obj);

### Arguments

1. `obj` (object) - the object to undecorate.

### Returns

- (object) the object with unit functionality removed.


Function: Unit.wrapEvents {#Unit-wrapEvents}
-------------------------

Wraps an object's `fireEvent` method to also invoke `publish`.

### Syntax

	Unit.wrapEvents(obj);

### Arguments

1. `obj` (object) - the object whose `fireEvent` method will be wrapped.

### Returns

- (object) the object with a wrapped `fireEvent` method.


Function: Unit.unwrapEvents {#Unit-unwrapEvents}
---------------------------

Unwraps an object's `fireEvent` method.

### Syntax

	Unit.unwrapEvents(obj);

### Arguments

1. `obj` (object) - the object whose `fireEvent` method will be unwrapped.

### Returns

- (object) the object with an unwrapped `fireEvent` method.


Unit Instance {#Unit-Instance}
=============

Unit Method: setupUnit {#Unit-setupUnit}
----------------------

Initializes the unit object.

### Syntax

	unit.setupUnit();

### Arguments

- None.

### Returns

- (unit) the unit instance.

### Notes

- This method is automatically called by the `Unit` constructor as well as `Unit.decorate`, so you don't need to explicitly call it.
- If you're subclassing or mixin-in `Unit` into your classes, you'll have to call this method as soon as possible.


Unit Method: extendUnit {#Unit-extendUnit}
-----------------------

Adds properties to a unit instance.

### Syntax

	unit.extendUnit(obj);

### Arguments

1. `obj` (mixed) - an object whose properties and methods will be added to the unit instance.

### Returns

- (unit) the unit instance.

### Notes

- If you pass a class or type constructor function to this method, it will instantiate that class or type first to obtain an object.


Unit Method: getPrefix {#Unit-getPrefix}
----------------------

Returns the prefix of a unit instance.

### Syntax

	unit.getPrefix();

### Arguments

- None.

### Returns

- (string) the prefix of the unit instance.


Unit Method: setPrefix {#Unit-setPrefix}
----------------------

Sets the prefix of a unit instance.

### Syntax

	unit.setPrefix(prefix);

### Arguments

1. `prefix` (string) - the new prefix for the unit instance.

### Returns

- (unit) the unit instance.


Unit Method: isAttached {#Unit-isAttached}
-----------------------

Checks whether a unit instance is connected to the dispatcher.

### Syntax

	unit.isAttached();

### Arguments

- None.

### Returns

- (boolean) `true` if the unit is connected to the dispatcher, `false` if otherwise.


Unit Method: attachUnit {#Unit-attachUnit}
-----------------------

Connects a unit to the dispatcher.

### Syntax

	unit.attachUnit();

### Arguments

- None.

### Returns

- (unit) the unit instance.


Unit Method: detachUnit {#Unit-detachUnit}
-----------------------

Disconnects a unit to the dispatcher.

### Syntax

	unit.detachUnit();

### Arguments

- None.

### Returns

- (unit) the unit instance.


Unit Method: publish {#Unit-publish}
--------------------

Broadcasts a message to all units.

### Syntax

	unit.publish(type, data, finalized);

### Arguments

1. `type` (string) - the type of message to be published.
2. `data` (mixed, optional) - the data associated with the message that will be passed to subscribers.
2. `finalized` (boolean, optional) - if set to true, the `message` will be broadcasted as final.

### Returns

- (unit) the unit instance.

### Notes

- If your unit has a prefix set, the prefix will automatically be prepended to the value of the `type` argument.
- If you want to bypass the auto prefixing behaviour, prepend the value of the `type` argument with an exclamation point (`!`).


Unit Method: subscribe {#Unit-subscribe}
----------------------

Subscribes a unit to a message type.

### Syntax

	unit.subscribe(type, fn);

### Arguments

1. `type` (string) - the type of message to subscribe to.
2. `fn` (function) - the function to execute when a message of the `type` is received.

### Returns

- (unit) the unit instance.

### Notes

- Prepending an exclamation point (`!`) to the `type` string argument will cause a replay: the last message of that type will be rebroadcasted for the current unit.


Unit Method: unsubscribe {#Unit-unsubscribe}
------------------------

Unsubscribes a unit from a message type.

### Syntax

	unit.unsubscribe(type, fn);

### Arguments

1. `type` (string) - the type of message to unsubscribe to.
2. `fn` (function, optional) - the function to execute when a message of the `type` is received.

### Returns

- (unit) the unit instance.


### Notes

- You must supply this method with exactly the same `fn` argument you used with the `subscribe` method in order for it to remove a single callback properly.
- Calling this method without a second argument will remove all callbacks for a type.

