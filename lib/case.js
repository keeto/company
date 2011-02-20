/*
---
script: case.js
description: test-case class
license: MIT-style license
authors:
- Mark Obcena
provides: [Case]
...
*/

(function(){

var checkArg = require('./utils').checkArg,
	Expectation = require('./expectation').Expectation;

var countExpect = function(fn){
	var str = fn.toString();
	var matches = str.match(/^[\s\t\n;]*(expect\(|expect.apply\(|expect.call\()/gm);
	var count = (!matches) ? 0 : matches.length;
	var perform = str.match(/:perform\s+([0-9]+)/g);
	if (perform){
		var performCount = (perform.pop().replace(/:perform\s+/, '') * 1);
		if (performCount <= count) return performCount;
	}
	return count;
};

var Case = function(desc, test, context, callback){
	if (!checkArg('expect', test))
		throw new SyntaxError('Case function does not explicitly define an `expect` argument.');

	this.desc = desc;
	this.$test = test;
	this.$context = context || {};

	this.$callbacks = {
		before: function(){},
		after: function(){}
	};
	callback = callback || {};
	this.setCallbacks({
		before: callback.before,
		after: callback.after
	});

	this.$testCount = countExpect(test);
	this.$doneCount = 0;

	this.$passes = 0;
	this.$failures = 0;
	this.$results = [];
};

Case.setMatcher = function(name, fn){
	Expectation.setMatcher(name, fn);
};

Case.prototype.count = function(){
	return this.$testCount;
};

Case.prototype.setCallback = function(type, fn){
	if (fn === undefined || !(fn instanceof Function))
		throw new TypeError('Case.setCallback requires a function as its second argument.');
	this.$callbacks[type] = fn;
	return this;
};

Case.prototype.setCallbacks = function(keys){
	for (var key in keys){
		if (keys[key] !== undefined && keys[key] instanceof Function) this.setCallback(key, keys[key]);
	}
	return this;
};

Case.prototype.done = function(){
	return (!(this.$testCount - this.$doneCount) || this.$finished);
};

Case.prototype.results = function(){
	if (!this.done()) return {};
	return {
		description: this.desc,
		allPassed: (this.$failures === 0),
		tests: {
			passes: this.$passes,
			failures: this.$failures,
			total: this.$testCount
		},
		results: this.$results
	};
};

var addResult = function(results, success, done){
	this.$results.push(results);
	this.$doneCount++;
	this[success ? '$passes' : '$failures']++;
	if (this.done()) this.$callbacks.after.call(this, this.results(), (this.$failures === 0));
};

var expectCallback = function(){
	var self = this;
	return function(result, received, expected, matcher){
		addResult.call(self, {
			passed: result,
			received: received,
			expected: expected,
			matcher: matcher
		}, result);
	};
};

Case.prototype.$expect = function(received){
	var self = this;
	return new Expectation(received, expectCallback.call(this));
};

Case.prototype.run = function(){
	var self = this, error;
	this.$callbacks.before.call(self, this.desc, this.$testCount);
	try {
		var expectProto = function(){
			return self.$expect.apply(self, Array.prototype.slice.call(arguments));
		};
		expectProto.perform = function(num){
			if (!isNaN(num)) self.$testCount = num;
		};
		this.$test.call(this.$context, expectProto);
	} catch(e){
		error = e;
	} finally {
		this.$finished = true;
		if (error) addResult.call(this, {
			passed: false,
			received: null,
			expected: null,
			matcher: null,
			error: error
		}, false);
	}
};

exports.Case = Case;

})();