(function() {

/*
 * Canonical URL creator.
 *
 * Given a URL (e.g., window.location.href or a relative URL such as
 * "/search"), returns a canonical URL so that both can be compared.
 *
 * Also provided is a helper method for that purpose: url_equals(). So on the
 * page "http://example.com/search", url_equals("/search", window.location)
 * will return true.
 *
 * See: http://www.ietf.org/rfc/rfc1808.txt Relative Uniform Resource Locators
 *
 * --
 * Bodacity JavaScript Utilities
 * http://adamhooper.com/bodacity
 * Public Domain (no licensing restrictions)
 */

function dirname(filename) {
	// Assume the filename is of the form "/a/b/c" (and return "/a/b").
	var i = filename.lastIndexOf('/');
	if (i > 0) {
		return filename.substring(0, i);
	} else {
		return '/';
	}
}

var base;
/*
 * Returns the base URL according to the <base> element.
 */
function get_base(options) {
	if (options && options.base) return dirname(options.base);

	if (base === undefined) {
		var base_elem = document.getElementsByTagName('base')[0];
		if (base_elem) {
			base = dirname(base_elem.href);
		} else {
			base = null;
		}
	}
	return base;
}

var relative;
/*
 * Returns the base URL according to window.location.
 *
 * This will be the dirname of the current file.
 */
function get_relative(options) {
	var loc;
	if (options && options.location) {
		loc = options.location;
	} else {
		loc = window.location;
	}

	var href = loc.protocol;
	href += '//';
	href += loc.hostname;
	if (loc.port) href += ':' + loc.port;
	href += loc.pathname;
	href += loc.search;
	href += loc.hash;

	return dirname(href);
}

/*
 * Takes ":80" and returns either ":80" or "", depending on the value of proto.
 */
function clean_port_with_proto(port, proto) {
	if (proto == 'http' && port == ':80') return '';
	if (proto == 'https' && port == ':443') return '';
	if (proto == 'ftp' && port == ':21') return '';
	return port || '';
}

// http://www.ietf.org/rfc/rfc1808.txt "Step 6"
var RE_CLEAN_PATH_DOT_SLASHES = /\/\.\//g;
var RE_CLEAN_PATH_DOT_AT_END = /\/\.$/;
var RE_CLEAN_PATH_DOTDOT = /[^\/]+\/\.\.\//;
var RE_CLEAN_PATH_DOTDOT_AT_END = /[^\/]+\/\.\.$/;
/*
 * Takes "//a" and returns "/a"; takes "" and returns "/".
 */
function clean_path(path) {
	if (!path) return '/';
	while (RE_CLEAN_PATH_DOT_SLASHES.test(path)) {
		path = path.replace(RE_CLEAN_PATH_DOT_SLASHES, '/');
	}
	path = path.replace(RE_CLEAN_PATH_DOT_AT_END, '/');
	while (RE_CLEAN_PATH_DOTDOT.test(path)) {
		path = path.replace(RE_CLEAN_PATH_DOTDOT, '');
	}
	path = path.replace(RE_CLEAN_PATH_DOTDOT_AT_END, '');
	return path;
}

var RE_CLEAN_URL = /^(\w+):\/\/([^:\/]+)?(:\d+)?([^\?#]*)/;
function clean_url(url) {
	var match = RE_CLEAN_URL.exec(url);
	var proto = match[1];
	var host = match[2] || '';
	var port = clean_port_with_proto(match[3], proto);
	var path = clean_path(match[4]);

	return proto + '://' + host + port + path;
}

var RE_PROTO = /^\w+:\/\//;
var RE_ALL_BUT_PATH = /^(\w+:\/\/[^\/]*)/;
function canonical_url(url, options) {

	if (RE_PROTO.test(url)) {
		return clean_url(url);
	}

	var start = get_base(options) || get_relative(options);

	if (url[0] == '/') {
		var all_but_path_match = RE_ALL_BUT_PATH.exec(start);
		return clean_url(all_but_path_match[1] + url);
	}

	return clean_url(start + '/' + url);
}

function url_equals(url1, url2, options) {
	return canonical_url(url1, options) == canonical_url(url2, options);
}

window.canonical_url = canonical_url;
window.url_equals = url_equals;

})();
