Company Guide
=============

* Table of Contents
{:toc}


Key Concepts {#key-concepts}
------------

### Units {#units}

In a Company-based application, each component (or module, as they're referred to in the *Modules and Callbacks* article) is represented by objects called **units**, which inherit from the `Unit` type.

### Implicit Mediation {#implicit-mediation}

Company uses a special object called the **dispatcher** as a mediator. The main difference with Company's dispatcher and simple mediators like the `window` object is that it is an *implicit* mediator: units can communicate through Company's dispatcher without calling it directly. Instead, units use special methods that abstract the dispatcher, which decouples the units themselves.

### Publish-Subscribe {#publish-subscribe}

Units converse with each other using a **simple pubsub-inspired API**. Each unit inherits a `subscribe` method that's used to hook a callback to other units, as well as a `publish` method that can be used to broadcast messages to other units.


Company Basics {#company-basics}
--------------

### Creating Units {#creating-units}

Units can be created using the `Unit` constructor, which takes a single optional argument called the `descriptor`. This snippet creates a new unit object with a `greet` method:

	var unit = new Unit({

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});


In order to keep stuff reusable, you can use mixins to add additional functionality to your unit. You can declare mixins using a `Uses` property in your descriptor:

	// Mixins
	var ObjectMixin = {
		objMethod: function(){}
	};

	var ClassMixin = new Class({
		classMethod: function(){}
	});

	var TypeMixin = new Type('T', function(){}).implement({
		typeMethod: function(){}
	});

	var UnitMixin = new Unit({
		unitMethod: function(){}
	});

	// Unit

	var unit = new Unit({
		
		Uses: [ObjectMixin, ClassMixin, TypeMixin, UnitMixin]

	});

	console.log(typeof unit.objMethod); // function;
	console.log(typeof unit.classMethod); // function;
	console.log(typeof unit.typeMethod); // function;
	console.log(typeof unit.unitMethod); // function;


### Subscribe and Publish {#subscribe-and-publish}

To make the most out of Company, though, you'll need to create two or more unit objects. These objects can then talk to each other via the pubsub system through the `subscribe` and `publish` methods.

	var unitA = new Unit({

		initSetup: function(){
			this.subscribe('greet', this.greet);
		},

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});

	var unitB = new Unit({

		initSetup: function(){
			this.publish('greet', 'Bobby');
		}

	});

The snippet above creates two unit objects. The first unit object, `unitA`, uses the `subscribe` method to listen to messages of the type `greet`. The second unit object `unitB`, on the other hand, uses `publish` to broadcast messages to other units.

Units can stop subscribing to messages by calling on the `unsubscribe` method:

	var unitA = new Unit({

		initSetup: function(){
			this.subscribe('greet', this.greet);
		},

		greet: function(name){
			console.log('Hello, ' + name);
			this.unsubscribe('greet', this.greet);
		}

	});

	var unitB = new Unit({

		initSetup: function(){
			this.publish('greet', 'Bobby');
		}

	});


### Special Setups {#special-setups}

You might have noticed the method above named `initSetup`. This method is a special setup method that's understood by the `Unit` constructor. This method is invoked automatically upon creation of the unit object, and can be used to setup various properties of the current module.

Aside from `initSetup`, units can also have two other setups methods: `readySetup` and `loadSetup`, which are called on domready and on load respectively. This setup methods can be useful for attaching event handlers to your unit's element assets, which might only be available during the domready or load events.

	var unit = new Unit({

		initSetup: function(){
			console.log('This is echoed immediately.');
		},

		readySetup: function(){
			console.log('This is echoed on domready.');
		},

		loadSetup: function(){
			console.log('This is echoed on load.');
		},

	});


### Variables? Optional! {#variables}

Because units are self-contained and are meant to talk to one another using the pubsub system, variable referencing is optional.

	new Unit({

		initSetup: function(){
			this.subscribe('greet', this.greet);
		},

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});

	new Unit({

		initSetup: function(){
			this.publish('greet', 'Bobby');
		}

	});

In fact, the use of implicit-mediation means that you can make units completely oblivious to one another. Here we have two "private" units:

	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

	(function(){
		new Unit({

			initSetup: function(){
				this.publish('greet', 'Bobby');
			}

		});
	})();

It is suggested that you use "handler-less" units like these as much as possible to prevent the temptation of calling units directly.


### Shared Dispatcher and Prefixes {#dispatcher-prefixes}

Each window context has a single, internal dispatcher object used by all units. This means that any unit published message, regardless of the origin, will be broadcasted to *all* units in the current window context.

	// first
	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

	// second
	(function(){
		new Unit({

			initSetup: function(){
				this.publish('greet', 'Bobby');
			}

		});
	})();

	// third
	(function(){
		new Unit({

			initSetup: function(){
				this.publish('greet', 'Robert');
			}

		});
	})();

In this example we have 3 units. Both units two and three publish the same "greet" message, which means that both messages will dispatch the callback from the unit one.

Sometimes though, you might want to differentiate among the messages of each unit. The easiest way to do it would be to use prefixes:

	// first
	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('second.greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

	// second
	(function(){
		new Unit({

			initSetup: function(){
				this.publish('second.greet', 'Bobby');
			}

		});
	})();

	// third
	(function(){
		new Unit({

			initSetup: function(){
				this.publish('third.greet', 'Robert');
			}

		});
	})();

Here we prefixed the message types with a descriptor of the unit. We then changed our `subscribe` code in the first unit to only respond to messages of the `second.greet` type.

To save typing though, you can declare a string `Prefix` property in your unit descriptor. The `publish` method will then automatically prepend this string to the message type:

	// first
	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('second.greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

	// second
	(function(){
		new Unit({

			Prefix: 'second',

			initSetup: function(){
				this.publish('greet', 'Bobby');
			}

		});
	})();

	// third
	(function(){
		new Unit({

			Prefix: 'third',

			initSetup: function(){
				this.publish('greet', 'Robert');
			}

		});
	})();

You can get a unit's prefix using the `getPrefix` method, and set it via the `setPrefix` method:

	new Unit({

		Prefix: 'unit',

		initSetup: function(){
			console.log(this.getPrefix()); // 'unit'
			this.setPrefix('notunit');
			console.log(this.getPrefix()); // 'notunit'
		}

	});

If you want to publish a message from a prefixed unit without the prefix, you can prepend the message type with an exclamation point. This will signal `publish` to leave the type string alone:

	// first
	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('second.greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

	// second
	(function(){
		new Unit({

			Prefix: 'second',

			initSetup: function(){
				this.publish('greet', 'Bobby');
			}

		});
	})();

	// third
	(function(){
		new Unit({

			Prefix: 'third',

			initSetup: function(){
				this.publish('!second.greet', 'Robert');
			}

		});
	})();


### Finalized Messages {#finalized-messages}

The `publish` method allows you to finalize a message by passing `true` as a third argument to the method:

	new Unit({

		Prefix: 'first',

		initSetup: function(){
			this.publish('done', null, true);
		}

	});

When you publish a finalized message, the message will be broadcasted to all current subscribers as well as any future subscribers. This is useful for one-off messages that are needed for any current or future subscribers.


### Replayed Messages {#replayed-messages}

Finalized messages are controlled by the publishing unit: a message can only be final if the unit declares it as final. Sometimes though, you'll want to be able to access the last broadcasted message of a type during subscription. This is needed especially for systems where the units will be lazy loaded, and therefore need to catch up on the last broadcasted message.

A simple answer to this is to use message replays during subscription. To do this, you'll have to prefix the message type argument to the `subscribe` call with an exclamation point:

	// first
	(function(){
		new Unit({

			Prefix: 'first',

			initSetup: function(){
				this.publish('greet', 'Bobby');
			}

		});
	})();

	// second
	(function(){
		new Unit({

			initSetup: function(){
				this.subscribe('!first.greet', this.greet);
			},

			greet: function(name){
				console.log('Hello, ' + name);
			}

		});
	})();

Here the first module publishes a non-finalized message called `first.greet` upon initialization. The second module, on the other hand, uses message replay by prefixing the message type with an exclamation point. This not only makes the second module listen to subsequent broadcasts but also immediately executes the callback with the arguments from the last executed broadcast.


### Detaching and Attaching {#detaching-attaching}

You can temporarily pause units by calling on the `detachUnit` method:

	new Unit({

		initSetup: function(){
			this.detachUnit();
			this.subscribe('second.greet', this.greet);
		},

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});

When a unit is detached, it is disconnected from the dispatcher. This means that it can call on its `subscribe` and `publish` methods, but it won't be able to receive nor broadcast messages from and to other units.

You can use the `isAttached` method to check if a unit is currently connected to the dispatcher:

	new Unit({

		initSetup: function(){
			this.detachUnit();
			console.log(this.isAttached()); // false
			this.subscribe('second.greet', this.greet);
		},

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});

When you're ready to reconnect your mediator, you can use the `attachUnit` method:

	new Unit({

		initSetup: function(){
			this.detachUnit();
			console.log(this.isAttached()); // false
			this.subscribe('second.greet', this.greet);

			var self = this;
			setTimeout(function(){
				self.attachUnit();
				console.log(self.isAttached()); // true
			}, 5000);
		},

		greet: function(name){
			console.log('Hello, ' + name);
		}

	});


Company For All {#company-for-all}
---------------

### Decorating Objects {#decoration}

While units are the primary building blocks of Company-based applications, there are times when you can't create real unit objects. An example is when you need to use class instances in your application.

Company allows you to transform any kind of object as a unit through *decoration*, using the `Unit.decorate` generic. This generic function takes any object as an argument and returns a "unit-like" object:

	// a regular unit
	var unit = new Unit({
		
		initSetup: function(){
			this.subscribe('request.success', this.onData);
		},

		onData: function(xml, text){
			console.log(text);
		}

	});
	// a class instance
	var request = new Request({
		url: 'somepage.php'
	});

	// decorate the instance
	Unit.decorate(request).setPrefix('request');

	request.send();

Unit-like objects have all the functionality of regular unit objects--they can subscribe to other unit's messages and they can broadcast messages to all other units.

The reverse function for `Unit.decorate` is `Unit.undecorate`, and it removes any unit-related functionality from an object.


### fireEvent Wrapping and Unwrapping {#wrapping-and-unwrapping}

An object decorated by `Unit.decorate` will automatically get its `fireEvent` methods wrapped to also call `publish`. This is done so that any events fired by the object will also be broadcasted through the dispatcher.

If you don't want the `fireEvent` method to be wrapped automatically, you can pass `true` as a second argument to `Unit.decorate`. This bypasses the wrapping:

	// a regular unit
	var unit = new Unit({
		
		initSetup: function(){
			this.subscribe('request.success', this.onData);
		},

		onData: function(xml, text){
			console.log(text);
		}

	});
	// a class instance
	var request = new Request({
		url: 'somepage.php'
	});

	// decorate the instance
	Unit.decorate(request, true).setPrefix('request');

	request.send(); // this will not be broadcasted

You can explicitly wrap or unwrap an object's `fireEvent` method using the `Unit.wrapEvents` and `Unit.unwrapEvents` functions respectively.


### Unit With Classes {#unit-with-classes}

Company exports the `Unit` constructor as a type and not as a class. In normal MooTools usage, classes cannot subclass types or use them as mixins. `Unit`, however, is an exception because it's implemented with a class-like constructor, which means that you can use `Unit` in custom classes.

	// Subclassing
	var UnitSub = new Class({

		Extends: Unit,

		Prefix: 'unitsub'

		initialize: function(){
			this.setupUnit();
			this.publish('hello', 'Bobby');
		}

	});

	// Mixin
	var UnitMix = new Class({

		Implements: Unit,

		Prefix: 'unitmix'

		initialize: function(){
			this.setupUnit();
			this.publish('hello', 'Bobby');
		}

	});

Take note how the `setupUnit` method is invoked in the `initialize` method of both classes. Because `Unit` is a type and not a class, you need to set it up explicitly using this method in order for it to work.


Keeping Company {#keeping-company}
---------------

You can learn more about the various methods and functions available from Company by checking out the [API Docs][api]


[api]: /api/ "API Documentation"

