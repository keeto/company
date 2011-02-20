/*
---
script: utils.js
description: utility functions
license: MIT-style license
authors:
- Mark Obcena
provides: [typeOf, instanceOf, checkArg]
...
*/

(function(){

exports.typeOf = function(item){
	var type = Object.prototype.toString.call(item);
	return type.replace(/\[object\s(.*)\]/, '$1').toLowerCase();
};

exports.instanceOf = function(item, type){
	var realtype = typeof item;
	switch(realtype){
		case 'string': item = new String(item); break;
		case 'number': item = new Number(item); break;
		case 'boolean': item = new Boolean(item); break;
	}
	return item instanceof type;
};

exports.checkArg = function(arg, fn){
	if (fn.length === 0) return false;
	var fnString = (fn.toSource) ? fn.toSource() : fn.toString();
	return new RegExp('^[\s(]*function[^(]*\\(' + arg + '[,\\)]+').test(fnString);
};

exports.extend = function(a, b){
	for (var i in b) a[i] = b[i];
	return a;
};

})();
