/*
---
name: Company

description: Mediated Component System for MooTools

version: 1.1

license: MIT-style

authors:
- Mark Joseph "Keeto" Obcena

requires:
- core/1.3: [Type, Events]

provides: [Unit]

...
*/


(function(){

// Utility Functions

var removeOnRegexp = /^on([A-Z])/,
	removeOnFn = function(_, ch){
		return ch.toLowerCase();
	};

var wrap = function(fn){
	return function(){
		return fn.apply(this, arguments);
	};
};

var mix = function(){
	var len = arguments.length;
	while(len--){
		var Current = arguments[len];
		switch (typeOf(Current)){
			case 'type':
			case 'class':
				Current.$prototyping = true;
				Object.append(this, new Current);
				delete Current.$prototyping;
			break;

			case 'unit':
				for (var i in Current){
					if (!Current.hasOwnProperty(i)) continue;
					var value = Current[i];
					this[i] = (typeof value == 'function' && !value.exec) ? wrap(value) : value;
				}
			break;

			default:
				Object.append(this, Current);
			break;
		}
	}
	return this;
};


// Dispatcher

var callback = function(){
	var current = callback.current;
	current.apply(current.$ownerObj, callback.args);
};

var Dispatcher = new Events;

unwrapClassMethods: for (var prop in Dispatcher){
	var item = Dispatcher[prop];
	if (typeof item != 'function' || item.exec || !item.$origin) continue;
	Dispatcher[prop] = item.$origin;
}

Object.append(Dispatcher, {

	$dispatched: {},
	$finished: {},
	$mediator: (this.document) ? this.document.createElement('script') : null,

	setup: function(){
		var mediator = this.$mediator;

		if (!mediator || (!mediator.attachEvent && !mediator.addEventListener)) return this;

		if (mediator.addEventListener){
			mediator.addEventListener('publishDispatch', callback, false);
			this.dispatch = function(fn, args){
				var e = document.createEvent('UIEvents');
				e.initEvent('publishDispatch', false, false);
				callback.args = args;
				callback.current = fn;
				mediator.dispatchEvent(e);
			};
		} else if (mediator.attachEvent && !mediator.addEventListener){
			$(document.head).appendChild(mediator);
			mediator.publishDispatch = 0;
			mediator.attachEvent('onpropertychange', callback);
			this.dispatch = function(fn, args){
				callback.args = args;
				callback.current = fn;
				mediator.publishDispatch++;
			};
			var cleanUp = function(){
				mediator.detachEvent('onpropertychange', callback);
				mediator.parentNode.removeChild(mediator);
				this.detachEvent('onunload', cleanUp);
			};
			window.attachEvent('onunload', cleanUp);
		}
		return this;
	},

	getFinished: function(key){
		return this.$finished[key] || null;
	},

	getDispatched: function(key){
		return this.$dispatched[key] || [];
	},

	dispatch: function(fn, args){
		callback.args = args;
		callback.current = fn;
		callback.call(null);
	},

	replay: function(type, fn){
		var dispatched = this.$dispatched,
			args = null;
		if (!dispatched || !(args = dispatched[type])) return false;
		this.dispatch(fn, args);
		return true;
	},

	redispatch: function(type, fn){
		var finished = this.$finished,
			args = null;
		if (!finished || !(args = finished[type])) return false;
		this.dispatch(fn, args);
		return true;
	},

	fireEvent: function(type, args, finish){
		var self = this,
			dispatched = this.$dispatched,
			finished = this.$finished,
			events = this.$events,
			handlers = null;
		type = type.replace(removeOnRegexp, removeOnFn);
		args = Array.from(args);
		dispatched[type] = args;
		if (finish) finished[type] = args;
		if (!events || !(handlers = events[type])) return this;
		for (var i = 0, l = handlers.length; i < l; i++){
			this.dispatch(handlers[i], args);
		}
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events){
				if (!events.hasOwnProperty(type)) continue;
				this.removeEvent(type, events[type]);
			}
			return this;
		}
		if (events) events = events.replace(removeOnRegexp, removeOnFn);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--;){
				if (i in fns) this.removeEvent(type, fns[i]);
			}
		}
		return this;
	},

	removeFinished: function(){
		var finished = this.$finished;
		for (var i in finished){
			if (!finished.hasOwnProperty(i) 
				|| i == 'window.domready'
				|| i == 'window.load') continue;
			delete finished[i];
		}
		return this;
	},

	removeDispatched: function(){
		var dispatched = this.$dispatched;
		for (var i in dispatched){
			if (!dispatched.hasOwnProperty(i) 
				|| i == 'window.domready'
				|| i == 'window.load') continue;
			delete dispatched[i];
		}
		return this;
	},

	flush: function(){
		this.removeEvents();
		delete Dispatcher.$events;
		Dispatcher.$events = {};
		this.removeFinished();
		this.removeDispatched();
		return this;
	}

}).setup();

// Load and DOMReady

window.addEvents({
	'domready': function(){
		Dispatcher.fireEvent('window.domready', [], true);
	},
	'load': function(){
		Dispatcher.fireEvent('window.load', [], true);
	}
});



// Unit Constructor

function Unit(desc){
	if (!(this instanceof Unit)) return new Unit(desc);

	this.$unitAttached = true;
	this.$unitHandlers = {};
	this.$unitPrefix = '';
	if (Unit.$prototyping) return this;
	if (desc){
		this.extendUnit(desc);
		this.setupUnit();
	}
	return this;
}

var decorateFireEvent = function(origin, rep){
	var fn = function(){
		rep.apply(this, arguments);
		return origin.apply(this, arguments);
	};
	fn.$unwrapped = origin;
	return fn;
};

var decorateFn = function(value, unit){
	var fn = function(){
		return value.apply(unit, arguments);
	};
	fn.$origin = value;
	return fn;
};

this.Unit = new Type('Unit', Unit).extend({

	isUnit: function(obj){
		if (typeOf(obj) === 'unit'){
			return true;
		} else {
			return obj.$unitInstance ? obj.$unitInstance instanceof Unit : false;
		}
	},

	decorate: function(obj, nowrap){
		if (obj.$unitInstance) return obj;
		var unit = obj.$unitInstance = new Unit;
		unit.extendUnit = function(ext){
			mix.call(obj, ext);
			return this;
		};
		for (var i in unit){
			var value = unit[i];
			if (obj[i] || i == '$family' || (typeof value !== 'function' || value.exec)) continue;
			obj[i] = decorateFn(value, unit);
		}
		obj.setupUnit();
		return (!nowrap) ? this.wrapEvents(obj) : obj;
	},

	undecorate: function(obj){
		var unit = obj.$unitInstance;
		if (!unit) return obj;
		for (var key in unit){
			var value = obj[key];
			if (!value || value.$origin == value) continue;
			delete obj[key];
		}
		this.unwrapEvents(obj);
		delete obj.$unitInstance;
		return obj;
	},

	wrapEvents: function(unit){
		var fireEvent = unit.fireEvent;
		if (!fireEvent || fireEvent.$unwrapped) return unit;
		unit.fireEvent = decorateFireEvent(fireEvent, function(type, args){
			unit.publish(type, args);
		});
		return unit;
	},

	unwrapEvents: function(unit){
		var fireEvent = unit.fireEvent;
		if (fireEvent && fireEvent.$unwrapped) unit.fireEvent = fireEvent.$unwrapped;
		return unit;
	}


}).implement({

	setupUnit: function(){
		var self = this;
		if (this.Uses){
			Array.from(this.Uses).each(this.extendUnit.bind(this));
			delete this.Uses;
		}
		if (this.Prefix){
			this.setPrefix(this.Prefix);
			delete this.Prefix;
		}

		if (this.initSetup) Dispatcher.dispatch(function(){ self.initSetup.apply(self); });
		if (this.readySetup) this.subscribe('window.domready', function(){ self.readySetup(); });
		if (this.loadSetup) this.subscribe('window.load', function(){ self.loadSetup(); });
		return this;
	},

	extendUnit: function(obj){
		mix.call(this, obj);
		return this;
	},

	getPrefix: function(){
		return this.$unitPrefix;
	},

	setPrefix: function(str){
		this.$unitPrefix = (str || '').toString();
		return this;
	},

	isAttached: function(){
		return !!this.$unitAttached;
	},

	detachUnit: function(){
		var attached = this.$unitHandlers;
		if (!this.$unitAttached) return this;
		for (var key in attached){
			var len = attached[key].length;
			while (len--){
				Dispatcher.removeEvent(key, attached[key][len]);
			}
		}
		this.$unitAttached= false;
		return this;
	},

	attachUnit: function(){
		var attached = this.$unitHandlers;
		if (this.$unitAttached) return this;
		for (var key in attached){
			var len = attached[key].length;
			while (len--){
				Dispatcher.addEvent(key, attached[key][len]);
			}
		}
		this.$unitAttached= true;
		return this;
	},

	destroyUnit: function(){
		this.detachUnit();
		this.$unitHandlers = {};
		return this;
	},

	subscribe: function(key, fn, replay){
		if (typeof key == 'object'){
			for (var i in key) this.subscribe(i, key[i], fn);
		} else {
			if (key.charAt(0) == '!') replay = !!(key = key.substring(1));
			fn.$ownerObj = this;
			if (!Dispatcher.redispatch(key, fn)){
				Events.prototype.addEvent.call({$events: this.$unitHandlers}, key, fn);
				if (this.$unitAttached){
					Dispatcher.addEvent(key, fn);
					if (replay) Dispatcher.replay(key, fn);
				}
			}
		}
		return this;
	},

	unsubscribe: function(key, fn){
		if (typeof key !== 'string'){
			for (var i in key) this.unsubscribe(i, key[i]);
		} else {
			Dispatcher.removeEvent(key, fn);
			Events.prototype.removeEvent.call({$events: this.$unitHandlers}, key, fn);
		}
		return this;
	},

	publish: function(type, args, finish){
		if (type.charAt(0) == '!') finish = (type = type.substring(1));
		else if (this.$unitPrefix) type = this.$unitPrefix + '.' + type;
		if (this.$unitAttached) Dispatcher.fireEvent.call(Dispatcher, type, args, finish);
		return this;
	},

	copublish: function(type, args){
		if (this.$unitAttached) Dispatcher.fireEvent.call(Dispatcher, type, args);
		return this;
	}

});


// Dispatcher Inspection

var wrapDispatcherFn = function(origin){
	var fn = function(){
		fn.$spy.apply(null, arguments);
		fn.$unwrapped.apply(Dispatcher, arguments);
	};
	return Object.append(fn, {$unwrapped: origin});
};

Unit.Dispatcher = {

	flush: function(){
		Dispatcher.flush();
		return this;
	},

	getFinished: function(){
		return Object.clone(Dispatcher.$finished);
	},

	removeFinished: function(){
		Dispatcher.removeFinished();
		return this;
	},

	getDispatched: function(key){
		return key ? (Dispatcher.$dispatched[key] || []).clone() : Object.clone(Dispatcher.$dispatched);
	},

	removeDispatched: function(){
		Dispatcher.removeDispatched();
		return this;
	},

	getSubscribers: function(key){
		return key ? (Dispatcher.$events[key] || []).clone() : Object.clone(Dispatcher.$events);
	},

	spySubscribe: function(spy){
		var fnAddEvent = Dispatcher.addEvent;
		if (!fnAddEvent.$unwrapped) Dispatcher.addEvent = wrapDispatcherFn(fnAddEvent);
		Dispatcher.addEvent.$spy = spy;
		return this;
	},

	unspySubscribe: function(){
		var fnAddEvent = Dispatcher.addEvent;
		if (fnAddEvent.$unwrapped){
			Dispatcher.addEvent = fnAddEvent.$unwrapped;
		}
		return this;
	},

	spyUnsubscribe: function(spy){
		var fnRemoveEvent = Dispatcher.removeEvent;
		if (!fnRemoveEvent.$unwrapped) Dispatcher.removeEvent = wrapDispatcherFn(fnRemoveEvent);
		Dispatcher.removeEvent.$spy = spy;
		return this;
	},

	unspyUnsubscribe: function(){
		var fnRemoveEvent = Dispatcher.removeEvent;
		if (fnRemoveEvent.$unwrapped){
			Dispatcher.removeEvent = fnRemoveEvent.$unwrapped;
		}
		return this;
	},

	spyPublish: function(spy){
		var fnFireEvent = Dispatcher.fireEvent;
		if (!fnFireEvent.$unwrapped) Dispatcher.fireEvent = wrapDispatcherFn(fnFireEvent);
		Dispatcher.fireEvent.$spy = spy;
		return this;
	},

	unspyPublish: function(){
		var fnFireEvent = Dispatcher.fireEvent;
		if (fnFireEvent.$unwrapped){
			Dispatcher.fireEvent = fnFireEvent.$unwrapped;
		}
		return this;
	}

};

}).call(this);

