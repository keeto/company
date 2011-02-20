(function(){

var suites = null,
	tests = {};

window.addSuite = function(desc){
	var test = tests[desc] = {};
	var suite = test.main = new Element('li', {
		'class': 'suite container',
		'children': [
			new Element('p', {'class': 'marks', 'text': '#'}),
			new Element('p', {
				'class': 'name',
				'children': [
					new Element('strong', {'text': desc}),
					new Element('span', {'text': '0/0'})
				]
			})
		]
	});
	suite.inject(suites);
	var details = test.details = new Element('li', {
		'class': 'tests',
		'styles': {'display': 'none'}
	})
	test.tests = new Element('ul').inject(details);
	details.inject(suites);
};

window.afterSuite = function(suite, success, results){
	suite = tests[suite];
	if (!suite) return null;
	suite = suite.main;
	suite.addClass('done');
	suite.getElement('p.marks').addClass(success ? 'passed' : 'failed').set('text', success ? 'P' : 'F');
	suite.getElement('span').set('text', [results.tests.passes, results.tests.total].join('/'))
};

window.suiteError = function(suite, count, error){
	suite = tests[suite];
	if (!suite) return null;
	suite.main.getElement('p.marks').addClass('failed').set('text', 'E');
	suite.tests.empty();
	new Element('li', {
		'text': 'Cannot run tests because of errors. [' + error.toString() + ']'
	}).inject(suite.tests);
};

window.addTest = function(suite, test, results){
	suite = tests[suite];
	if (!suite) return null;
	test = new Element('li',{
		'children': new Element('p', {
			'html': ['<strong>', results.allPassed ? 'P' : 'F', ':</strong> it ', test].join(''),
			'children': new Element('span', {
				'text': [results.tests.passes, '/', results.tests.total].join('')
			})
		})
	});
	if (!results.allPassed){
		for (var i = 0, y = results.results.length; i < y; i++){
			var result = results.results[i];
			if (result.passed) continue;
			var sub = new Element('p', {'class': 'expect'});
			if (result.error){
				sub.set('html', [
				'<strong>', (i + 1), ':</strong> Error thrown: <strong>',
				result.error, '</strong>'
				].join(''));
			}
			else sub.set('html', [
				'<strong>', (i + 1), ':</strong> ',
				'Expected ', result.matcher, ' <strong>', (result.expected) ? result.expected : '',
				'</strong>, got <strong>', result.received, '</strong>'
			].join(''));
			sub.inject(test);
		}
		suite.details.setStyle('display', 'block');
	}
	test.inject(suite.tests)
};

window.after = function(success, results){
	$(document.html).tween('background-color', success ? '#dbfaca' : '#fdccd4');
	$('passed').set('text', results.tests.passes);
	$('failed').set('text', results.tests.failures);
	$('total').set('text', results.tests.total);
};

window.addEvent('domready', function(){
	suites = $('suitecontainer');
	var frame = $('runnerframe');
	document.body.addEvents({
		'click:relay(li.suite)': function(){
			if (!this.hasClass('done')) return null;
			var test = this.getNext('li.tests');
			test.setStyle('display', test.getStyle('display') == 'none' ? 'block' : 'none');
		}
	});
	$('runtests').getElement('a').addEvent('click', function(e){
		e.preventDefault();
		$('results').setStyle('display', 'block');
		this.setStyle('display', 'none');
		frame.contentWindow.runTests();
	});
});

})();