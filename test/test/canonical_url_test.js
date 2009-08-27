$(document).ready(function() {

module('canonical_url.js');

function test_url(message, url, expected, options) {
	test(message + ': "' + url + '" => "' + expected + '"', function() {
		var actual = canonical_url(url, options);
		equals(expected, actual);
	});
}

function mock_location(protocol, hostname, port, pathname, search, hash) {
	var href = protocol;
	href += '//';
	href += hostname;
	if (port) href += ':' + port;
	href += pathname;
	href += search;
	href += hash;

	return {
		href: href,
		protocol: protocol || '',
		hostname: hostname || '',
		port: port || '',
		pathname: pathname || '',
		search: search || '',
		hash: hash || ''
	};
}

test_url('absolute', 'http://example.com/', 'http://example.com/');
test_url('absolute missing slash', 'http://example.com', 'http://example.com/');
test_url('starts with slash', '/', 'http://example.com/', { base: 'http://example.com/' });
test_url('empty', '', 'http://example.com/', { base: 'http://example.com/' });
test_url('hides http port', 'http://example.com:80/', 'http://example.com/');
test_url('shows http port', 'http://example.com:8080/', 'http://example.com:8080/');
test_url('hides https port', 'https://example.com:443', 'https://example.com/');
test_url('works with file:///', 'bar', 'file:///foo/bar', { base: 'file:///foo/' });
test_url('ignores part of base when path starts with /', '/bar', 'http://example.com/bar', { base: 'http://example.com/foo/' });
test_url('uses base when path does not start with /', 'bar', 'http://example.com/foo/bar', { base: 'http://example.com/foo/' });
test_url('uses existing location', 'bar', 'http://example.com/foo/bar', { location: mock_location('http:', 'example.com', '80', '/foo/', '', '') });
test_url('shows http port with relative URLs using location', 'bar', 'http://example.com:8080/foo/bar', { location: mock_location('http:', 'example.com', '8080', '/foo/', '', '') });
test_url('ignores query', 'bar', 'http://example.com/foo/bar', { location: mock_location('http:', 'example.com', '80', '/foo/', '?q=blah', '') });
test_url('ignores hash', 'bar', 'http://example.com/foo/bar', { location: mock_location('http:', 'example.com', '80', '/foo/', '', '#foo') });
test_url('folds "./"', 'bar/./baz', 'http://example.com/foo/bar/baz', { base: 'http://example.com/foo/' });
test_url('folds "././"', 'http://example.com/foo/bar/././baz', 'http://example.com/foo/bar/baz');
test_url('folds /.$', 'bar/.', 'http://example.com/foo/bar/', { base: 'http://example.com/foo/' });
test_url('folds blah/../', 'http://example.com/foo/../bar', 'http://example.com/bar');
test_url('folds blah/../blah/..', 'http://example.com/foo/../bar/../baz', 'http://example.com/baz');
test_url('folds blah/..$', 'http://example.com/foo/bar/..', 'http://example.com/foo/');
test_url('folds foo/bar/baz/../..$', 'http://example.com/foo/bar/baz/../..', 'http://example.com/foo/');
test_url('does not fold ".." at the beginning of a url', 'http://example.com/../foo', 'http://example.com/../foo');

test('url_equals() works', function() {
	ok(url_equals('http://example.com:80/foo/../bar', 'http://example.com/bar'));
});

});
