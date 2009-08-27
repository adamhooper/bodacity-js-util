$(document).ready(function() {

module('jquery.excerpt.js');

/*
 * Specify a fixed-width (10 chars wide) width.
 *
 * We'll test with a monospace font, so we know the exact width of every
 * word we wrap. We'll compute this 10-char-wide width on our first test and
 * cache it for the future.
 */
var max_width = undefined;

function apply_css($elem) {
	$elem.css('font-family', 'monospace');
	$elem.css('font-size', '12px');
}

function calculate_max_width() {
	if (max_width) return max_width;

	var $span = $('<span></span>');
	apply_css($span);
	$span.text('mmmmmmmmmm');
	mock_html($span);
	max_width = $span.width();
	$span.remove();
	return max_width;
}

function test_with_mock(message, text, callback) {
	test(message, function() {
		var $mock = $('<div></div>');
		apply_css($mock);
		$mock.text(text);
		$mock.width(calculate_max_width());
		mock_html($mock);
		callback($mock);
		$mock.remove();
	});
}

function test_with_excerpt(message, text, options, callback) {
	test_with_mock(message, text, function($mock) {
		$mock.excerpt(options);
		callback($mock);
	});
}

test_with_mock('excerpt() exists', '', function($mock) {
	ok($.isFunction($mock.excerpt));
});

test_with_excerpt('Does nothing on short strings', '1234567890', {}, function($mock) {
	equals('1234567890', $mock.text());
});

test_with_excerpt('Does nothing on empty strings', '', {}, function($mock) {
	equals('', $mock.text());
});

test_with_excerpt('Crops too-long strings', '123 567 90 2', {end: ''}, function($mock) {
	equals('123 567 90', $mock.text());
});

test_with_excerpt('Adds end when cropping', '123 567 901', {end: '…'}, function($mock) {
	equals('123 567…', $mock.text());
});

test_with_excerpt('Adds always_end when cropping', '123 567 901', {end: '', always_end: '…'}, function($mock) {
	equals('123 567…', $mock.text());
});

test_with_excerpt('Adds always_end when not cropping', '123', {always_end: '…'}, function($mock) {
	equals('123…', $mock.text());
});

test_with_excerpt('Adds both end and always_end when cropping', '123 567 901', {end: '…', always_end: '…'}, function($mock) {
	equals('123 567……', $mock.text());
});

test_with_excerpt('Ensures end does not surpass limit', '123 567 90 2', {end: '…'}, function($mock) {
	equals('123 567…', $mock.text());
});

test_with_excerpt('Allows 2 lines', '123 567 90 123 567 90', {end: 'Y', lines: 2}, function($mock) {
	equals('123 567 90 123 567 90', $mock.text());
});

test_with_excerpt('Shrinks after 2 lines', '123 567 90 123 567 90 123', {end:'X', lines: 2}, function($mock) {
	equals('123 567 90 123 567X', $mock.text());
});

test_with_excerpt('Allows HTML elements in "end" option', '123 567 90 2', {end: $('<a href="http://example.com">…</a>')[0]}, function($mock) {
	equals('123 567…', $mock.text());
});

test_with_excerpt('Allows HTML elements in "always_end" option', '123 567 90 2', {end: '', always_end: $('<a href="http://example.com">…</a>')[0]}, function($mock) {
	equals('123 567…', $mock.text());
});

test_with_excerpt('Shows "end" even when it is too long', '123456 8901', {end:'78901'}, function($mock) {
	equals('12345678901', $mock.text());
});

test_with_excerpt('Shows "always_end" even when it is too long', '123456 8901', {end:'', always_end:'78901'}, function($mock) {
	equals('12345678901', $mock.text());
});

});
