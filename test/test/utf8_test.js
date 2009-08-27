$(document).ready(function() {

module('utf8.js');

function array_equals(expected, actual, message) {
	if (!message) message = 'array equality';
	equals(actual.length, expected.length, message + ': length');
	for (var i = 0; i < actual.length || i < expected.length; i++) {
		equals(expected[i], actual[i], ': char ' + i);
	}
}

test('String.prototype.to_utf8_byte_array() exists', function() {
	ok($.isFunction(String.prototype.to_utf8_byte_array));
});

test('to_utf8_bytes() understands ASCII characters', function() {
	array_equals([ 0x61, 0x62, 0x63 ], 'abc'.to_utf8_byte_array());
});

test('to_utf8_bytes() encodes "café" properly', function() {
	array_equals([ 0x63, 0x61, 0x66, 0xc3, 0xa9 ], 'café'.to_utf8_byte_array());
});

test('to_utf8_bytes() encodes "‏" (right-to-left marker) properly', function() {
	array_equals([ 0xe2, 0x80, 0x8f ], '‏'.to_utf8_byte_array());
});

test('to_utf8_bytes() encodes "𝟡" (U+1D7E1 MATHEMATICAL DOUBLE-STRUCK DIGIT NINE) properly', function() {
	array_equals([ 0xf0, 0x9d, 0x9f, 0xa1 ], '𝟡'.to_utf8_byte_array());
});

test('utf8_num_bytes() figures out "𝟡" (U+1D7E1 MATHEMATICAL DOUBLE-STRUCK DIGIT NINE) properly', function() {
	equals('𝟡'.utf8_num_bytes(), 4);
});

});
