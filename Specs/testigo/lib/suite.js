/*
---
script: suite.js
description: test-suite class
license: MIT-style license
authors:
- Mark Obcena
provides: [Suite]
...
*/

(function(){

var checkArg = require('./utils').checkArg,
	Case = require('./case').Case,
	Spy = require('./spy').Spy;

var Suite = function(name, body, callbacks){
	if (!checkArg('it', body))
		throw new SyntaxError('Suite function does not explicitly define an `it` argument.');

	this.name = name;
	this.$body = body;
	this.$tests = [];
	this.$results = [];
	this.$context = {
		createSpy: function(fn, bound){
			return new Spy(fn, bound);
		}
	};

	this.$callbacks = {
		before: function(){},
		beforeEach: function(){},
		after: function(){},
		afterEach: function(){}
	};
	callbacks = callbacks || {};
	this.setCallbacks({
		before: callbacks.before,
		beforeEach: callbacks.beforeEach,
		after: callbacks.after,
		afterEach: callbacks.afterEach
	});

	this.$testCount = 0;
	this.$doneCount = 0;
	this.$passes = 0;
	this.$failures = 0;

	this.$scaffolds = {
		before: function(){},
		beforeEach: function(){},
		after: function(){},
		afterEach: function(){}
	};
};

Suite.setMatcher = function(name, fn){
	Case.setMatcher(name, fn);
};

Suite.prototype.setCallback = function(type, fn){
	if (fn === undefined || !(fn instanceof Function))
		throw new TypeError('Suite.setCallback requires a function as its second argument.');
	this.$callbacks[type] = fn;
	return this;
};

Suite.prototype.setCallbacks = function(keys){
	for (var key in keys){
		if (keys[key] !== undefined && keys[key] instanceof Function) this.setCallback(key, keys[key]);
	}
	return this;
};

Suite.prototype.done = function(){
	return !(this.$testCount - this.$doneCount);
};

Suite.prototype.count = function(){
	return this.$testCount;
};

Suite.prototype.results = function(){
	if (!this.done()) return {};
	return {
		suite: this.name,
		allPassed: (this.$failures === 0),
		tests: {
			passes: this.$passes,
			failures: this.$failures,
			total: this.$testCount
		},
		results: this.$results
	};
};

var callNext = function(){
	var current = this.$tests.shift();
	if (current){
		this.$scaffolds.beforeEach.call(this.$context);
		current.run();
	} else {
		this.$scaffolds.after.call(this.$context);
		this.$callbacks.after.call(null, this.name, (this.$failures === 0), this.results());
	}
};

var itCallback = function(){
	var self = this;
	return function(results, success){
		self.$doneCount++;
		self.$results.push(results);
		self[success ? '$passes' : '$failures']++;
		self.$scaffolds.afterEach.call(self.$context);
		self.$callbacks.afterEach.call(null, self.name, results.description, results);
		callNext.call(self);
	};
};

Suite.prototype.$it = function(desc, fn){
	var self = this;
	this.$testCount++;
	var test = new Case(desc, fn, this.$context, {
		before: function(desc, count){
			self.$callbacks.beforeEach.call(null, self.name, desc, count);
		},
		after: itCallback.call(this)
	});
	this.$tests.push(test);
};

Suite.prototype.$setup = function(type, fn){
	if (fn !== undefined && fn instanceof Function) this.$scaffolds[type] = fn;
	return this;
};

Suite.prototype.prepare = function(){
	var self = this;
	this.$body.call(null, function(){
		return self.$it.apply(self, Array.prototype.slice.call(arguments));
	}, function(){
		return self.$setup.apply(self, Array.prototype.slice.call(arguments));
	});
	this.$prepared = true;
	this.$callbacks.before.call(null, this.name, this.$testCount);
	return this;
};

Suite.prototype.run = function(){
	if (!this.$prepared) this.prepare();
	this.$scaffolds.before.call(this.$context);
	callNext.call(this);
	return this;
};

exports.Suite = Suite;

})();
