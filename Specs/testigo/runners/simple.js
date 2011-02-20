/*
---
script: simple.js
description: a simple runner
license: MIT-style license
authors:
- Mark Obcena
provides: [SimpleRunner]
...
*/

(function(){

var sys, printer = function(type){
	switch(type){
		case 'node': return require('sys').print;
		case 'helma':
		case 'ringo':
		case 'flusspferd':
			sys = require('system');
			return function(str){
				sys.stdout.write(str);
				sys.stdout.flush();
			};
		case 'v8cgi': return system.stdout;
	}
	return function(){};
};

var SimpleRunner = function(type, testigo, colors, stack){
	this.$testigo = testigo;
	this.$buffer = [];
	this.$stdout = printer(type);
	this.$colors = (colors !== undefined) ? colors : true;
	this.$stack = (stack !== undefined) ? stack : true;
	this.addCallbacks();
};

SimpleRunner.prototype.$setColor = function(color){
	if (!this.$colors) return this;
	var colors = {
		black: '30',
		red: '31',
		green: '32', 
		yellow: '33',
		blue: '34',
		magenta: '35',
		cyan: '36',
		white: '37'
	};
	if (color && colors[color]) this.$print("\u001B[" + colors[color] + "m");
	else this.$print("\u001B[0m");
	return this;
};

SimpleRunner.prototype.$print = function(str){
	this.$buffer.push(str);
	return this;
};

SimpleRunner.prototype.$flush = function(){
	if (this.$buffer.length !== 0){
		this.$stdout(this.$buffer.join(''));
		this.$buffer = [];
	}
	return this;
};

var callbacks = {

	before: function(){
		this.$print('Starting Tests..\n');
	},

	after: function(success, results){
		this.$print('\nTests Finished: ');
		if (success){
			this.$setColor('green');
			this.$print('Passed');
		} else {
			this.$setColor('red');
			this.$print('Failed');
		}
		this.$setColor();
		this.$print([
			' (Passed: ', results.tests.passes, ', Failed: ', results.tests.failures, ')\n'
		].join(''));
	},

	beforeSuite: function(suite, count){
		this.$setColor('yellow');
		this.$print('\n' + suite);
		this.$setColor();
		this.$print([' (', count, ' Tests):', '\n'].join(''));
	},

	suiteError: function(suite, count, error){
		this.$setColor('red');
		this.$print(' Cannot run tests because of error: \n');
		this.$setColor();
		this.$print(['    Error thrown: "', error,'"\n'].join(''));
		if (this.$stack) {
			this.$print('       --- Error Details ---\n');
			this.$print('         Name: ' + error.name + '\n');
			if (error.stack) {
				this.$print('         Stack --- \n');
				this.$print('         ' + error.stack.split('\n').join('\n         ') + '\n');
				this.$print('         --------- \n');
			} else if (error.fileName && error.lineNumber) {
				this.$print('         Message --- \n');
				this.$print(['         ', error.message, 'at', error.fileName, ':', error.lineNumber, '\n'].join(' '));
				this.$print('         --------- \n');
			}
			this.$print('       ---------------------\n');
		}
		this.$print(['End ', suite, ': '].join(''));
		this.$setColor('red');
		this.$print('Failed');
		this.$setColor();
		this.$print(' (Cannot run tests.)\n');
	},

	afterSuite: function(suite, success, results){
		this.$print(['End ', suite, ': '].join(''));
		if (success){
			this.$setColor('green');
			this.$print('Passed');
		} else {
			this.$setColor('red');
			this.$print('Failed');
		}
		this.$setColor();
		this.$print([' (Passes: ', results.tests.passes, ', Failures: ', results.tests.failures,').\n'].join(''));
	},

	beforeTest: function(suite, test, count){
		this.$print(' - ');
		this.$print(test);
		this.$print('... ');
	},

	afterTest: function(suite, test, results){
		if (results.allPassed) {
			this.$setColor('green');
			this.$print('Passed');
		} else {
			this.$setColor('red');
			this.$print('Failed');
		}
		this.$setColor();
		this.$print([' (', results.tests.passes, '/', results.tests.total, ').\n'].join(''));

		for (var i = 0, y = results.results.length; i < y; i++){
			var result = results.results[i];
			if (result.passed) continue;
			this.$setColor('red');
			this.$print(['     ', i + 1, ': '].join(''));
			this.$setColor();
			if (result.error){
				this.$print([
					'Error thrown: "', result.error,'"\n'
				].join(''));
				if (this.$stack) {
					this.$print('       --- Error Details ---\n');
					this.$print('         Name: ' + result.error.name + '\n');
					if (result.error.stack) {
						this.$print('         Stack --- \n');
						this.$print('         ' + result.error.stack.split('\n').join('\n         ') + '\n');
						this.$print('         --------- \n');
					} else if (result.error.fileName && result.error.lineNumber) {
						this.$print('         Message --- \n');
						this.$print(['         ', result.error.message, 'at', result.error.fileName, ':', result.error.lineNumber, '\n'].join(' '));
						this.$print('         --------- \n');
					}
					this.$print('       ---------------------\n');
				}
			} else {
				this.$print([
					'Expected ', result.matcher, ' ', (result.expected) ? result.expected : '',
					', got ', result.received, '\n'
				].join(''));
			}
		}
	}
};

SimpleRunner.prototype.addCallbacks = function(){
	var self = this;
	for (var key in callbacks) (function(type, fn){
		self.$testigo.setCallback(type, function(){
			var result = fn.apply(self, Array.prototype.slice.call(arguments));
			self.$flush();
			return result;
		});
	})(key, callbacks[key]);
};

SimpleRunner.prototype.run = function(){
	this.$testigo.run();
};

exports.SimpleRunner = SimpleRunner;

})();