$(document).ready(function() {

module('patch/jquery.datetime_picker_field.js');

test('datetime_picker_field() exists', function() {
	ok($.isFunction($('<input/>').datetime_picker_field));
});

function test_with_picker(message, options, initial_value, callback) {
	test(message, function() {
		var $input = $('<input type="text"/>');
		mock_html($input);
		$input.val(initial_value);
		$input.num_calls_to_open = 0;
		$input.num_calls_to_close = 0;
		var real_options = $.extend({
			surrounding_element: $('#mocks'),
			parse_callback: function(s) { return Date.parse(s); },
			format_callback: function(d) { return d.toString(); },
			open_calendar_callback: function() { $input.num_calls_to_open += 1; },
			close_calendar_callback: function() { $input.num_calls_to_close += 1; }
		}, options);
		$input.datetime_picker_field(real_options);
		disable_animations(function() {
			callback($input);
		});
		$input.siblings().remove(); // the datetime picker
		$input.remove();
	});
}

test_with_picker('does not immediately add a calendar widget', {}, '', function($input) {
	equals($('div.calendar_date_picker').length, 0);
});

test_with_picker('adds a calendar date picker on focus', {}, '', function($input) {
	$input.focus();
	equals($('div.calendar_date_picker').length, 1);
});

test_with_picker('does not add two calendars', {}, '', function($input) {
	$input.focus();
	$input.focus();
	equals($('div.calendar_date_picker').length, 1);
});

test_with_picker('removes the calendar on blur', {}, '', function($input) {
	$input.focus();
	$input.blur();
	equals($('div.calendar_date_picker').length, 0);
});

test_with_picker('Calls open_calendar_callback on focus', {}, '', function($input) {
	$input.focus();
	equals($input.num_calls_to_open, 1);
});

test_with_picker('Calls close_calendar_callback on blur', {}, '', function($input) {
	$input.focus();
	$input.blur();
	equals($input.num_calls_to_close, 1);
});

});
