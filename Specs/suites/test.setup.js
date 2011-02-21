/*jsl:ignoreall*/
exports.setup = function(Tests){

Tests.describe('Unit Instance: Extension', function(it, setup){

	it('should have an extendUnit method', function(expect){
		var unit = new Unit();
		expect(unit.extendUnit).toBeType('function');
		expect(typeOf(unit.extendUnit)).toBe('function');
	});

	it('should add properties from the descriptor during construction', function(expect){
		var desc = {something: 1};

		// explicit
		var unitWithoutDesc = new Unit();
		expect(unitWithoutDesc.something).toBeUndefined();

		unitWithoutDesc.extendUnit({something: 1});
		expect(unitWithoutDesc.something).not.toBeUndefined();

		// implicit
		var unitWithDesc = new Unit(desc);
		expect(unitWithDesc.something).not.toBeUndefined();
	});

	it('should instantiate classes and types', function(expect){
		var unit = new Unit();

		// class
		expect(unit.classMethod).toBeUndefined();
		expect(unit.classMethod).not.toBeType('function');

		var C = new Class({ classMethod: function(){} });
		unit.extendUnit(C);

		expect(unit.classMethod).not.toBeUndefined();
		expect(unit.classMethod).toBeType('function');

		// type
		expect(unit.typeMethod).toBeUndefined();
		expect(unit.typeMethod).not.toBeType('function');

		var T = new Type('T', function(){}).implement({ typeMethod: function(){} });
		unit.extendUnit(T);

		expect(unit.typeMethod).not.toBeUndefined();
		expect(unit.typeMethod).toBeType('function');
	});

});

Tests.describe('Unit Instance: PubSub', function(it, setup){

	setup('before', function(){
		this.dispatcher = Unit.Dispatcher;
	});

	setup('beforeEach', function(){
		Unit.Dispatcher.flush();
	});

	it('should have publish, subscribe and unsubscribe methods', function(expect){
		var unit = new Unit();
		expect(unit.publish).not.toBeUndefined();
		expect(unit.publish).toBeType('function');
		expect(unit.subscribe).not.toBeUndefined();
		expect(unit.subscribe).toBeType('function');
		expect(unit.unsubscribe).not.toBeUndefined();
		expect(unit.unsubscribe).toBeType('function');
	});

	it('should add callbacks on subscribe', function(expect){
		var unit = new Unit(),
			fn = function(){};

		unit.subscribe('event', fn);

		var subscribers = this.dispatcher.getSubscribers();
		expect(typeOf(subscribers.event)).toBe('array');
		expect(subscribers.event.length).toBe(1);
		expect(subscribers.event[0]).toBe(fn);
	});

	it('should remove callbacks on unsubscribe', function(expect){
		var subscribers,
			unit = new Unit(),
			fn = function(){};

		unit.subscribe('event', fn);

		subscribers = this.dispatcher.getSubscribers();
		expect(typeOf(subscribers.event)).toBe('array');
		expect(subscribers.event.length).toBe(1);
		expect(subscribers.event[0]).toBe(fn);

		unit.unsubscribe('event', fn);
		subscribers = this.dispatcher.getSubscribers();
		expect(subscribers.event ? subscribers.event[0] : null).not.toBe(fn);
	});

	it('should dispatch callbacks on publish', function(expect){
		expect.perform(1);
		var unit = new Unit(),
			fn = this.createSpy();

		unit.subscribe('event', fn);
		unit.publish('event').publish('event');

		expect(fn.getCallCount()).toBe(2);
	});

	it('should dispatch callbacks with arguments on publish', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy();

		unit.subscribe('event', fn);
		unit.publish('event', [1, 2, 3]);

		expect(fn.getLastArgs()).toBeLike([1, 2, 3]);
	});

	it('should work across units', function(expect){
		var unitA = new Unit(),
			unitB = new Unit(),
			fn = this.createSpy(),
			obj = {};

		unitA.subscribe('event', fn);
		unitB.publish('event', obj);

		expect(fn.getCallCount()).toBe(1);
		expect(fn.getLastArgs()).toBeLike([obj]);
	});

	it('should continue if an error is thrown in one callback', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy();

		unit.subscribe('event', function(){ fn(); });
		unit.subscribe('event', function(){ throw new Error('Ignore this error--it\'s meant to be here.'); });
		unit.subscribe('event', function(){ fn(); });
		unit.publish('event');

		expect(fn.getCallCount()).toBe(2);
	});

	it('should dispatch subsequent callbacks immediately if published as final', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy();

		unit.publish('event', null, true);
		unit.subscribe('event', function(){ fn(); });
		unit.subscribe('event', function(){ fn(); });

		expect(fn.getCallCount()).toBe(2);
	});

	it('should dispatch a callback immediately if replay is on', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy(),
			obj = {};

		unit.publish('event', obj);

		unit.subscribe('event', function(e){ fn(e); }); // shouldn't fire

		unit.subscribe('event', function(e){ fn(e); }, true);
		unit.subscribe('!event', function(e){ fn(e); });

		expect(fn.getCallCount()).toBe(2);
	});

	it('should not dispatch callback if detached', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy();

		unit.subscribe('event', fn);
		unit.publish('event');

		unit.detachUnit();	
		unit.publish('event');

		expect(fn.getCallCount()).toBe(1);
	});

	it('should resume dispatch callback if reattached', function(expect){
		expect.perform(1);

		var unit = new Unit(),
			fn = this.createSpy();

		unit.detachUnit();	
		unit.subscribe('event', fn);

		unit.attachUnit();
		unit.publish('event');
		unit.publish('event');

		expect(fn.getCallCount()).toBe(2);
	});

});

Tests.describe('Unit Instance: Prefix', function(it, setup){

	setup('after', function(){
		Unit.Dispatcher.flush();
	});

	it('should have a getPrefix method', function(expect){
		var unit = new Unit();
		expect(typeOf(unit.getPrefix)).toBe('function');
		expect(unit.getPrefix).toBeType('function');
	});

	it('should have a setPrefix method', function(expect){
		var unit = new Unit();
		expect(typeOf(unit.setPrefix)).toBe('function');
		expect(unit.setPrefix).toBeType('function');
	});

	it('should set the prefix', function(expect){
		var unit = new Unit({Prefix: 'unit'});
		expect(unit.getPrefix()).toBe('unit');

		unit.setPrefix('notUnit');
		expect(unit.getPrefix()).not.toBe('unit');
		expect(unit.getPrefix()).toBe('notUnit');
	});

	it('should automatically be added to event names on publish', function(expect){
		var unitA = new Unit(),
			unitB = new Unit({Prefix: 'b'}),
			fn = this.createSpy(),
			obj = {};

		unitA.subscribe('b.event', fn);
		unitB.publish('event', obj);

		expect(fn.getCallCount()).toBe(1);
		expect(fn.getLastArgs()).toBeLike([obj]);
	});

});

Tests.describe('Unit Instance: Setup', function(it, setup){

	setup('beforeEach', function(){
		Unit.Dispatcher.flush();
	});

	it('should dispatch the initSetup function immediately', function(expect){
		expect.perform(1);

		var fn = this.createSpy(),
			unit = new Unit({
				initSetup: fn
			});

		expect(fn.getCallCount()).toBe(1);
	});

	it('should dispatch the readySetup and loadSetup on DomReady and Load', function(expect){
		expect.perform(1);

		var fn = this.createSpy(),
			unit = new Unit({
				readySetup: fn,
				loadSetup: fn
			});

		expect(fn.getCallCount()).toBe(2);
	});

});

};
