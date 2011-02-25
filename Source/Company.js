/*
---
name: Company

description: Mediated Component System for MooTools

version: 1.0.X

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

var removeOn = Events.removeOn || function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
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
					if (Current.hasOwnProperty(i)) this[i] = Current[i];
				}
				break;
			default:
				Object.append(this, Current);
		}
	}
	return this;
};

var unwrapClass = function(obj){
	for (var i in obj){
		var item = obj[i];
		if (item instanceof Function && item.$origin){
			obj[i] = item.$origin;
		}
	}
	return obj;
};


// Dispatcher

var callback = function(){
	var current = callback.current;
	current.apply(current.$ownerObj, callback.args);
};

var Dispatcher = Object.append(unwrapClass(new Events), {

	$dispatched: {},
	$finished: {},
	$mediator: (this.document) ? this.document.createElement('script') : null,

	setup: function(){
		var mediator = this.$mediator;

		if (!mediator || (!mediator.attachEvent && !mediator.addEventListener)) return this;

		if (mediator.addEventListener){
			mediator.addEventListener('publishDispatch', callback, false);
			this.dispatch = function(fn){
				var e = document.createEvent('UIEvents');
				e.initEvent('publishDispatch', false, false);
				callback.current = fn;
				mediator.dispatchEvent(e);
			};
		} else if (mediator.attachEvent && !mediator.addEventListener){
			$(document.head).appendChild(mediator);
			mediator.publishDispatch = 0;
			mediator.attachEvent('onpropertychange', callback);
			this.dispatch = function(fn){
				callback.current = fn;
				mediator.publishDispatch++;
			};
			var cleanUp = function(){
				mediator.detachEvent('onpropertychange', callback);
				mediator.parentNode.removeChild(mediator);
				this.detachEvent('onunload', cleanup);
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

	dispatch: function(fn){
		callback.current = fn;
		callback.call(null);
	},

	replay: function(type, fn){
		if (!this.$dispatched || !this.$dispatched[type]) return false;
		callback.args = this.$dispatched[type];
		this.dispatch(fn);
		return true;
	},

	redispatch: function(type, fn){
		if (!this.$finished || !this.$finished[type]) return false;
		callback.args = this.$finished[type];
		this.dispatch(fn);
		return true;
	},

	fireEvent: function(type, args, finish){
		var self = this;
		type = removeOn(type);
		args = Array.from(args);
		if (finish) this.$finished[type] = args;
		this.$dispatched[type] = callback.args = args;
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(this.dispatch);
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--;){
				if (i in fns) this.removeEvent(type, fns[i]);
			}
		}
		return this;
	},

	flush: function(){
		var i;
		this.removeEvents();
		delete Dispatcher.$events;
		Dispatcher.$events = {};
		var finished = this.$finished;
		for (i in finished){
			if (finished.hasOwnProperty(i) && !({
				'window.domready': 1,
				'window.load': 1
			})[i]) delete finished[i];
		}
		var dispatched = this.$dispatched;
		for (i in dispatched){
			if (dispatched.hasOwnProperty(i) && !({
				'window.domready': 1,
				'window.load': 1
			})[i]) delete dispatched[i];
		}
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

var wrapEventFn = function(origin, rep){
	var fn = function(){
		rep.apply(this, arguments);
		return origin.apply(this, arguments);
	};
	fn.$unwrapped = origin;
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
		if (!obj.$unitInstance){
			var unit = obj.$unitInstance = new Unit;
			unit.extendUnit = function(ext){
				mix.call(obj, ext);
				return this;
			};
			for (var i in unit) (function(key, value){
				if (!obj[i] && i !== '$family' && value instanceof Function){
					obj[i] = function(){
						return value.apply(unit, arguments);
					};
					obj[i].$origin = value;
				}
			})(i, unit[i]);
			obj.setupUnit();
			if (!nowrap) this.wrapEvents(obj);
		}
		return obj;
	},

	undecorate: function(obj){
		var unit = obj.$unitInstance;
		if (unit){
			for (var i in unit) (function(key, value){
				if (obj[key] && obj[key].$origin == value){
					delete obj[key];
				}
			})(i, unit[i]);
			this.unwrapEvents(obj);
			delete obj.$unitInstance;
		}
		return obj;
	},

	wrapEvents: function(unit){
		if (unit.fireEvent && !unit.fireEvent.$unwrapped) unit.fireEvent = wrapEventFn(unit.fireEvent, function(type, args){
			unit.publish(type, args);
		});
		return unit;
	},

	unwrapEvents: function(unit){
		if (unit.fireEvent && unit.fireEvent.$unwrapped) unit.fireEvent = unit.fireEvent.$unwrapped;
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
			if (key.charAt(0) == '!'){
				replay = true;
				key = key.substring(1);
			}
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
		if (type.charAt(0) == '!') type = type.substring(1);
		else if (this.$unitPrefix) type = this.$unitPrefix + '.' + type;
		if (this.$unitAttached) Dispatcher.fireEvent.call(Dispatcher, type, args, finish);
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

	getDispatched: function(key){
		return key ? (Dispatcher.$dispatched[key] || []).clone() : Object.clone(Dispatcher.$dispatched);
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

