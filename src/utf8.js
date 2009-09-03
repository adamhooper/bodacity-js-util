(function() {

/*
 * Returns the component bytes of the String, were it encoded as utf-8.
 *
 * (JavaScript does not provide access to the underlying encoding, so we must
 * encode the String to a series of bytes manually. This is unpleasant, but on
 * the plus side it makes our String methods work irrespective of encoding.)
 *
 * The resultant bytes are also encoded as Numbers. Each Number is guaranteed
 * to be between 0 and 255 (inclusive).
 *
 * For instance: the four-character string, "Café" produces as output a
 * five-Number Array, [ 0x43, 0x61, 0x66, 0xc3, 0xa9 ].
 *
 * --
 * Bodacity JavaScript Utilities
 * http://adamhooper.com/bodacity
 * Public Domain (no licensing restrictions)
 */
String.prototype.to_utf8_byte_array = function() {
	var bytes = [];

	var s = unescape(encodeURIComponent(this));

	for (var i = 0; i < s.length; i++) {
		var c = s.charCodeAt(i);
		bytes.push(c);
	}

	return bytes;
};

/*
 * Returns the number of bytes in the given UTF-8 string.
 */
String.prototype.utf8_num_bytes = function() {
	return unescape(encodeURIComponent(this)).length;
};

})();
