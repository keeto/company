/*
---
script: testigo.js
description: main testigo class
license: MIT-style license
authors:
- Mark Obcena
provides: [Testigo]
...
*/

(function(){

var Suite = require('./lib/suite').Suite;

var Testigo = function(callbacks){
	this.$suites = [];
	this.$results = {};

	this.$suiteCount = 0;
	this.$suitesDone = 0;
	this.$testCount = 0;
	this.$doneCount = 0;
	this.$passes = 0;
	this.$failures = 0;

	this.$callbacks = {
		describe: function(){},
		before: function(){},
		beforeSuite: function(){},
		beforeTest: function(){},
		after: function(){},
		afterSuite: function(){},
		afterTest: function(){},
		suiteError: function(){}
	};
	callbacks = callbacks || {};
	this.setCallbacks({
		describe:callbacks.describe,
		before: callbacks.before,
		beforeSuite: callbacks.beforeSuite,
		beforeTest: callbacks.beforeTest,
		after: callbacks.after,
		afterSuite: callbacks.afterSuite,
		afterTest: callbacks.afterTest,
		suiteError: callbacks.suiteError
	});
};

Testigo.prototype.setCallback = function(name, fn){
	if (fn === undefined || !(fn instanceof Function))
		throw new TypeError('Testigo.setCallback requires a function as its second argument.');
	this.$callbacks[name] = fn;
	return this;
};

Testigo.prototype.setCallbacks = function(keys){
	for (var key in keys){
		if (keys[key] !== undefined && keys[key] instanceof Function) this.setCallback(key, keys[key]);
	}
	return this;
};

Testigo.prototype.done = function(){
	return !(this.$suiteCount - this.$suitesDone);
};

Testigo.prototype.results = function(){
	if (!this.done()) return {};
	return {
		allPassed: (this.$failures === 0),
		tests: {
			passes: this.$passes,
			failures: this.$failures,
			total: this.$testCount
		},
		results: this.$results
	};
};

Testigo.prototype.describe = function(name, fn){
	var self = this;
	this.$suiteCount++;
	this.$results[name] = {};
	var suite = new Suite(name, fn, {
		before: function(suite, count){
			self.$testCount += count;
			self.$callbacks.beforeSuite.call(null, suite, count);
		},
		after: function(suite, success, results){
			self.$suitesDone++;
			self.$passes += results.tests.passes;
			self.$failures += results.tests.failures;
			self.results[suite] = results;
			self.$callbacks.afterSuite.call(null, suite, success, results);
			callNext.call(self);
		},
		beforeEach: function(suite, test, count){
			self.$callbacks.beforeTest.call(null, suite, test, count);
		},
		afterEach: function(suite, test, results){
			self.$callbacks.afterTest.call(null, suite, test, results);
		}
	});
	this.$suites.push(suite);
	this.$callbacks.describe.call(null, name);
};

var callNext = function(){
	var current = this.$suites.shift();
	if (current){
		try {
			current.run();
		} catch(e){
			this.$suitesDone++;
			this.$failures += current.count();
			this.$callbacks.suiteError.call(null, current.name, current.count(), e);
			callNext.call(this);
		}
	} else {
		this.$callbacks.after.call(null, (this.$failures === 0), this.results());
	}
};

Testigo.prototype.run = function(){
	this.$callbacks.before.call(null, this.$suiteCount);
	callNext.call(this);
};

Testigo.version = [0,1,9];
Testigo.versionText = Testigo.version.join('.');

Testigo.Runners = {
	Simple: require('./runners/simple').SimpleRunner
};

Testigo.setMatcher = Testigo.prototype.setMatcher = function(name, fn){
	Suite.setMatcher(name, fn);
};

Testigo.setMatchers = Testigo.prototype.setMatchers = function(matchers){
	for (var m in matchers) Suite.setMatcher(m, matchers[m]);
};

exports.Testigo = Testigo;

})();
