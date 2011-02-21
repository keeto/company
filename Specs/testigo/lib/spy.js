(function(){

var extend = require('./utils').extend;

var Spy = function(fn, bound){
	fn = fn || function(){};
	var spy = function(){
		var results,
			args = Array.prototype.slice.call(arguments);
		spy.$invocations++;
		spy.$argStack.push(args);
		try {
			results = fn.apply(bound || this, args);
		} catch (e){
			spy.$errors++;
			spy.$errorStack.push(e);
		}
		return results;
	};

	spy.$invocations = 0;
	spy.$argStack = [];
	spy.$errors = 0;
	spy.$errorStack = [];

	return extend(spy, this);
};

Spy.prototype.getCallCount = function(){
	return this.$invocations;
};

Spy.prototype.getLastArgs = function(){
	return this.$argStack[this.$argStack.length - 1];
};

Spy.prototype.getArgs = function(){
	return this.$argStack.slice(0);
};

Spy.prototype.getErrorCount = function(){
	return this.$errors;
};

Spy.prototype.getLastError = function(){
	return this.$errorStack[this.$errorStack.length - 1];
};

Spy.prototype.getErrors = function(){
	return this.$errorStack.slice(0);
};

exports.Spy = Spy;

})();
