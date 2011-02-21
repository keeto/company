exports.setup = function(Tests){

Tests.describe('Unit Constructor', function(it, setup){

	it('should be a type constructor', function(expect){
		expect(typeof Unit).toBe('function');
		expect(typeOf(Unit)).toBe('type');
	});

	it('should instantiate unit objects when called with new', function(expect){
		var unit = new Unit;
		expect(unit instanceof Unit).toBeTrue();
		expect(instanceOf(unit, Unit)).toBeTrue();
	});

	it('should instantiate unit objects when called as a function', function(expect){
		var unit = Unit();
		expect(unit instanceof Unit).toBeTrue();
		expect(instanceOf(unit, Unit)).toBeTrue();
	});

	it('should setup units with descriptors', function(expect){
		var unit = new Unit({something: 1});
		expect(unit.isAttached()).toBeTrue();
		expect(unit.something).toBe(1);
	});

	it('should not setup units without descriptors', function(expect){
		var unit = new Unit;
		expect(unit.isAttached()).toBeTrue();
		expect(unit.something).toBeUndefined();
	});

});

Tests.describe('Unit Constructor: Decoration', function(it){

	it('should decorate objects', function(expect){
		var C = new Class(),
			instance = Unit.decorate(new C);

		expect(typeOf(instance)).not.toBe('unit');
		expect(Unit.isUnit(instance)).toBeTrue();
	});

	it('should decorate types', function(expect){
		var instance;

		// array
		instance = Unit.decorate([]);
		expect(typeOf(instance)).not.toBe('unit');
		expect(Unit.isUnit(instance)).toBeTrue();

		// function
		instance = Unit.decorate(function(){});
		expect(typeOf(instance)).not.toBe('unit');
		expect(Unit.isUnit(instance)).toBeTrue();

		// object
		instance = Unit.decorate({});
		expect(typeOf(instance)).not.toBe('unit');
		expect(Unit.isUnit(instance)).toBeTrue();
	});


	it('should undecorate objects', function(expect){
		var C = new Class(),
			instance = new C;

		Unit.decorate(instance);
		expect(Unit.isUnit(instance)).toBeTrue();

		Unit.undecorate(instance);
		expect(Unit.isUnit(instance)).not.toBeTrue();
	});

});

Tests.describe('Unit Constructor: Subclassing', function(it){

	it('should be subclassable', function(expect){
		expect.perform(3);
		var C = new Class({ Extends: Unit }),
			instance = new C;

		expect(typeOf(instance)).toBe('unit');
		expect(instanceOf(instance, Unit)).toBeTrue();
		expect(Unit.isUnit(instance)).toBeTrue();
	});

	it('should be mixable', function(expect){
		expect.perform(3);
		var C = new Class({ Implements: Unit }),
			instance = new C;

		expect(typeOf(instance)).not.toBe('unit');
		expect(instanceOf(instance, Unit)).not.toBeTrue();
		expect(Unit.isUnit(instance)).not.toBeTrue();
	});

});

Tests.describe('Unit Constructor: Event Wrapping', function(it, setup){

	setup('before', function(){
		Unit.Dispatcher.flush();
	});

	setup('beforeEach', function(){
		this.fE = this.createSpy();
		this.obj = {
			fireEvent: this.fE
		};
	});

	it('should wrap events', function(expect){
		var obj = this.obj;

		Unit.decorate(obj, true);
		Unit.wrapEvents(obj);

		expect(obj.fireEvent).toBeType('function');
		expect(obj.fireEvent).not.toBe(this.fE);
	});

	it('should call the original events', function(expect){
		var obj = this.obj;

		Unit.decorate(obj, true);
		Unit.wrapEvents(obj);

		var fn = function(){};

		obj.fireEvent('something');
		expect(this.fE.getCallCount()).toBe(1);
	});

	it('should unwrap events', function(expect){
		var obj = this.obj;

		Unit.decorate(obj, true);
		Unit.wrapEvents(obj);
		Unit.unwrapEvents(obj);

		expect(obj.fireEvent).toBeType('function');
		expect(obj.fireEvent).toBe(this.fE);
	});

});

};
