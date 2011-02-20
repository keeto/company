Testigo: A CommonJS Testing Framework
=====================================

Testigo is a basic testing framework for CommonJS (and the browser). It could be used asynchronously, it is engine-agnostic and relies on explicit argument declarations for its test functions.


A Taste of Syntax
-----------------

	var Testigo = require('./testigo').Testigo;
	
	var Tests = new Testigo(),
		Runner = new Testigo.Runner.Simple('node', Tests);
	
	Tests.describe('This is a simple test', function(it, setup){
		
		setup('beforeEach', function(){
			this.number = 100;
			this.str = 'testigo';
		});
		
		it('should handle simple tests', function(expect){
			expect(this.number).toBe(100);
		});
		
		it('should handle async functions', function(expect){
			var str = this.str;
			setTimeout(function(){
				expect(str).toEqual('testigo');
			}, 5000);
		});
		
	});
	
	Runner.run();

Testigo relies on explicit argument declarations for its testing functions `it` and `expect`. Rather than making these functions globals, Testigo passes these test functions as arguments in order to ensure that their scope would resolve to the current test-suite. Failing to define these named arguments will result in a syntax error.


Usage and API
-------------

To use Testigo, load it as a module via `require(pathToTestigo.js)`. The library exports one constructor, `Testigo`, that could be used to create new tests.

### Testigo: Constructor

	new Testigo(callbacks)

Creates a new Testigo Object.

**Arguments:**

1. `callbacks` (object) - an object containing callback name/function pairs (see below).

**Callbacks and Signatures:**

- `before` - `fn(suiteCount)`, the function to invoke before all test-suites are run.
- `beforeSuite` - `fn(suiteName, testCount)`, the function to invoke before running each test-suite.
- `beforeTest` - `fn(suiteName, testDescription, expectationCount)`, the function to invoke before running a single test in a test-suite.
- `after` - `fn(allPassed, results)`, the function to invoke after all test-suites are run.
- `afterSuite` - `fn(suiteName, allPassed, results)`, the function to invoke after running each test suit.
- `afterTest` - `fn(suiteName, testDescription, results)`, the function to invoke after running a single test in a test-suite.

### Testigo Instance: describe()

	testigo.describe(name, function(it, setup){});

Adds a new test-suite to the testigo object.

**Argument:**

1. `name` (string) - the name of the test-suite.
2. `body` (function) - the main function for the test-suite; must explicitly define the `it` named-argument.

### Testigo Test-Suite: setup()

	setup(type, fn);

This function is passed as the second argument to the body-function of a test-suite and is used to setup scaffoldings for tests-cases.

**Arguments:**

1. `type` (string) - could be any of the following:
	- "before" - the function will be invoked before all test-cases are run.
	- "after" - the function will be invoked after all test-cases are run.
	- "beforeEach" - the function will be invoked before each test-case is run.
	- "afterEach" - the function will be invoked after each test-case is run.
2. `fn` (function) - the function to invoke.

### Testigo Test-Suite: it()

	it(description, function(expect){});

This function is passed as the first argument to the body-function of a test-suite and is used to create new test-cases for a test-suite.

**Arguments:**

1. `description` (string) - the description of the test;
2. `body` (function) - the main function for the test-case; must explicitly define the `expect` named-argument.

### Testigo Test-Case: expect()

	expect(received).<matcher>(expected);

This function is passed as the only argument to the body-function of a test-case and is used to create a new expectation.

**Arguments:**

1. `received` (any) - any value.

### Testigo Instance: setMatcher()

	testigo.addMatcher(name, matcher);

Adds a new matcher for expectations.

**Argument:**

1. `name` (string) - the name of the matcher.
2. `matcher` (function) - the matcher function; should return true if the expectation matches the conditions of the function, false otherwise.

**Included Matchers:**

A matcher is a method that checks the received value of an expectation against an expected value. The following matchers are available:

- `toBe` - equality test
- `toEqual` - equality test
- `toBeType` - type test; uses `Object.prototype.toString`, not `typeof`
- `toBeAnInstanceOf` - constructor test; automatically wraps primitives
- `toBeNull` - `null` test
- `toBeUndefined` - `undefined` test
- `toBeTrue` - `true` test
- `toBeFalse` - `false` test
- `toBeTruthy` - truthy value test
- `toBeFalsy` - falsy value test
- `toHaveMember` - membership test; uses `in`
- `toHaveProperty` - membership test; uses `in`, checks for `instanceof Function == false`
- `toHaveMethod` - membership test; uses `in`, checks for `instanceof Function == true`
- `toBeLike` - members test; checks member similarity for objects, item similarity for arrays and equality for all others.
- `toBeSimilar` - `JSON.stringify` equality test
- `toMatch` - `regexp.test()` test

You can also negate a test via the `not` property:

	expect(true).not.toFalsy(); // true


Runners
-------

A runner takes a Testigo instance, runs the test-suites and prints out the result.

**Simple Runner for CommonJS**

A simple console-based runner for CommonJS implementations is included and could be found under `Testigo.Runners.Simple`. Check the `runner.<enginename>.js` files /Specs folder for examples of how to use it in the supported commonjs engines.

**Basic Runner for the Browser**

A basic runner for the browser is also included. Check the `runner.html` and `tests.html` files /Specs folder for an example of how to use it.


Credits
-------

- Test syntax inspired by [Jasmine](http://github.com/pivotal/jasmine)


Copyright and License
---------------------

Copyright 2010, Mark Obcena. MIT-Style License (see LICENSE).
