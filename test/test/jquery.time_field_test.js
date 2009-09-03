$(document).ready(function() {

module('patch/jquery.time_field.js');

test('time_field() exists', function() {
	ok($.isFunction($('<input/>').time_field));
});

function test_with_tf(message, initial_value, options, callback) {
	test(message, function() {
		var $tf = $('<input/>').val(initial_value).time_field(options);
		callback($tf);
	});
}

test_with_tf('time_field emits time_field:time_changed on keypress', '', {}, function($tf) {
	var n = 0;
	$tf.bind('time_field:time_changed', function() { n++; });
	$tf.val('11:00');
	$tf.keypress();
	equals(n, 1);
});

test_with_tf('time_field does not emit time_field:time_changed when unchanged', '11:00', {}, function($tf) {
	var n = 0;
	$tf.bind('time_field:time_changed', function() { n++; });
	$tf.keypress();
	equals(n, 0);
});

test_with_tf('time_field:set_time sets value', '', {}, function($tf) {
	$tf.trigger('time_field:set_time', '11:00');
	equals($tf.val(), '11:00am');
});

test_with_tf('time_field:set_time triggers time_field:time_changed', '', {}, function($tf) {
	var n;
	$tf.bind('time_field:time_changed', function(_, t) { n = t; });
	$tf.trigger('time_field:set_time', '11:00');
	equals(n, '11:00');
});

test_with_tf('time_field:set_time does not rewrite its time if the actual value does not change', '01:05pm', {}, function($tf) {
	var n = 0;
	$tf.bind('time_field:time_changed', function() { n++; });
	$tf.trigger('time_field:set_time', '13:05'); // would normally write "1:05pm"
	equals(n, 0);
	equals($tf.val(), '01:05pm');
});

function test_time_parse(s, expected, options) {
	test_with_tf('parsing "' + s + '"', '1:03am', options || {}, function($tf) {
		var actual;
		$tf.bind('time_field:time_changed', function(_, t) { actual = t; });
		$tf.val(s);
		$tf.keypress();
		equals(actual, expected);
	});
}

test_time_parse('11:00', '11:00');
test_time_parse('11:00am', '11:00');
test_time_parse('1:00', '01:00');
test_time_parse('1:05', '01:05');
test_time_parse('1:00pm', '13:00');
test_time_parse('12:00', '12:00');
test_time_parse('12:00am', '00:00');
test_time_parse('12:00pm', '12:00');
test_time_parse('23:00', '23:00');
test_time_parse('11:00pm', '23:00');
test_time_parse(' 11:00 ', '11:00');
test_time_parse('1pm', '13:00');
test_time_parse('1:03pm', '13:03');
test_time_parse('1:3', null);
test_time_parse('', null);
test_time_parse('04:4', null);
test_time_parse('04:4', '00:00', { on_invalid: '00:00' });
test_time_parse('23:59', '23:59');
test_time_parse('24:00', null);
test_time_parse('12:59', '12:59');
test_time_parse('12:60', null);
test_time_parse('13:00am', null);
test_time_parse('13:00pm', null);
test_time_parse('0:00am', null);

function test_time_format(time, expected) {
	test_with_tf('formatting "' + time + '"', '1:03am', {}, function($tf) {
		$tf.trigger('time_field:set_time', time);
		var actual = $tf.val();
		equals(actual, expected);
	});
}

test_time_format('11:00', '11:00am');
test_time_format('01:00', '1:00am');
test_time_format('13:00', '1:00pm');
test_time_format('23:00', '11:00pm');
test_time_format('00:00', '12:00am');
test_time_format('12:00', '12:00pm');
test_time_format('15:23', '3:23pm');
test_time_format(null, '');

});
