(function(){

var $try = function(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try { return arguments[i](); } catch(e){}
	}
	return null;
};

var XHR = function(){
	try { return new XMLHttpRequest(); } catch(e){}
	try { return new ActiveXObject('MSXML2.XMLHTTP'); } catch(e){}
	try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e){}
};

var load = function(path){
	var result = false;
	if (!(/\.js$/).test(path)) path = path + '.js';
	var xhr = XHR();
	xhr.open('GET', path + '?d=' + new Date().getTime(), false);
	xhr.send(null);
	if (xhr.status >= 200 && xhr.status < 300) result = xhr.responseText;
	return result;
};

var normalize = function(path, base){
	path = path.split('/').reverse();
	base = base.split('/');
	var last = base.pop();
	if (last && !(/\.[A-Za-z0-9_-]+$/).test(last)) base.push(last);
	var i = path.length;
	while (i--){
		var current = path[i];
		switch (current){
			case '.': break;
			case '..': base.pop(); break;
			default: base.push(current);
		}
	}
	return base.join('/');
};

var require = function req(module, path){
	if (path) require.paths.unshift(path);
	var cont = true, contents = false, base = '';
	for (var i = 0, y = require.paths.length; (i < y) && cont; i++) (function(_current){
		base = normalize(module, _current);
		contents = load(base);
		if (contents !== false){
			cont = false;
			base = base.replace(/(?:\/)[^\/]*$/, '');
		}
	})(require.paths[i]);
	if (contents === false) throw new Error('Cannot find module "' + module + '"');
	var exports = {}, fn = 'var require = function(m){ return _require(m, _base); };' + contents;
	new Function('_require, _base, exports', fn).call(window, req, base, exports);
	if (path) require.paths.shift();
	return exports;
};

require.paths = [window.location.pathname];

window.require = require;

})();
