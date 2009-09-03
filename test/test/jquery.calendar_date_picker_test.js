$(document).ready(function() {

module('patch/jquery.calendar_date_picker.js');

test('calendar_date_picker() exists', function() {
	ok($.isFunction($('<div></div>').calendar_date_picker));
});

/*
 * Tests that the displayed calendar has the correct DOM format.
 *
 * Arguments:
 * - message: test() message
 * - selector: CSS selector (rooted at the calendar's <div>) (defaults to message)
 * - options: options to pass to .calendar_date_picker() (may be undefined)
 * - equals_or_callback:
 *	 - if undefined: just test that the selector finds something
 *	 - if a function: pass the results of $.fn.find() to the function and test
 *	   nothing
 *	 - otherwise: test $.fn.find(...).text() with the given parameter
 */
function test_for_required_element(message, selector, options, equals_or_callback) {
	test(message, function() {
		if (selector === undefined) selector = message;

		var $div = $('<div></div>');
		$div.calendar_date_picker(options || {});
		var $elems = $div.find(selector);

		if (equals_or_callback === undefined) {
			ok($elems.length, '"' + selector + '" matches something');
		} else if ($.isFunction(equals_or_callback)) {
			equals_or_callback($elems);
		} else {
			equals($elems.text(), equals_or_callback, 'text() is correct');
		}
	});
}

test_for_required_element('div.calendar_date_picker');
test_for_required_element('div.calendar_date_picker>table');
test_for_required_element('div.calendar_date_picker>table>thead.month>tr>th>a.previous_month');
test_for_required_element('div.calendar_date_picker>table>thead.month>tr>th>span.month');
test_for_required_element('div.calendar_date_picker>table>thead.month>tr>th>span.year');
test_for_required_element('div.calendar_date_picker>table>thead.month>tr>th>a.next_month');
test_for_required_element('div.calendar_date_picker>table>thead.days_of_week');
test_for_required_element('div.calendar_date_picker>table>tbody');
test_for_required_element('div.calendar_date_picker>div.time>label', 'div.calendar_date_picker>div.time>label', { time_text: 'X' }, 'X');
test_for_required_element('div.calendar_date_picker>div.time>label>input', 'div.calendar_date_picker>div.time>label>input', { time_text: 'X' });

test_for_required_element('a.previous_month follows option', 'a.previous_month', { previous_month_text: 'X' }, 'X');
test_for_required_element('a.next_month follows option', 'a.next_month', { next_month_text: 'X' }, 'X');

test_for_required_element('thead.days_of_week has 7 <th>s', 'thead.days_of_week', undefined, function($elems) {
	equals($elems.find('th').length, 7, '7 days in the week');
});

test_for_required_element('tbody has five rows usually, with the dates in the proper places', 'tbody', { focus_date: new Date(2008, 11, 5) }, function($elems) {
	equals($elems.find('tr').length, 5);
	for (var i = 0; i < 5; i++) {
		equals($elems.find('tr:eq(' + i + ') td').length, 7, 'week ' + i + ' has 7 days');
	}
	equals($elems.find('tr:eq(0)>td:eq(0)').text(), '', 'Nov 30th empty');
	equals($elems.find('tr:eq(0)>td:eq(1)').text(), '1', 'Dec 1 written');
	equals($elems.find('tr:eq(4)>td:eq(3)').text(), '31', 'Dec 31 written');
	equals($elems.find('tr:eq(4)>td:eq(4)').text(), '', 'Jan 1st empty');
});

test_for_required_element('tbody works with four rows', 'tbody', { focus_date: new Date(2009, 1, 1) }, function($elems) {
	equals($elems.find('tr').length, 4);
});

test_for_required_element('selected class is shown', 'tbody', { focus_date: new Date(2008, 11, 5), selected_date: new Date(2008, 11, 5) }, function($elems) {
	equals($elems.find('a.selected').length, 1, 'only 1 element is selected');
	equals($elems.find('td.selected a.selected').length, 1, 'wrapped in a td.selected');
	equals($elems.find('tr:eq(0)>td:eq(5)>a.selected').length, 1, 'it is the proper element');
});

test_for_required_element('today class is shown', 'tbody', { today_date: new Date(2008, 11, 5), focus_date: new Date(2008, 11, 5) }, function($elems) {
	equals($elems.find('a.today').length, 1, 'only 1 element is today');
	equals($elems.find('td.today a.today').length, 1, 'wrapped in a td.today');
	equals($elems.find('tr:eq(0)>td:eq(5)>a.today').length, 1, 'it is the proper element');
});

test_for_required_element('today class is shown, even with time_text specified', 'tbody', { today_date: new Date(2009, 0, 26, 9, 15), focus_date: new Date(2009, 0, 25, 9, 10), time_text: 'X' }, function($elems) {
	equals($elems.find('a.today').length, 1, 'exactly 1 element is today');
});

test_for_required_element('focus is on selected date if present', 'span.year', { selected_date: new Date(2000, 0, 1) }, function($elems) {
	equals($elems.text(), '2000');
});

test_for_required_element('focus is on focus date (over selected_date)', 'span.year', { focus_date: new Date(2000, 0, 1), selected_date: new Date(2001, 0, 1) }, '2000');

test_for_required_element('focus is on today (if no selected_date)', 'span.year', { today_date: new Date(2000, 0, 1) }, '2000');

function test_with_mock(message, options, callback) {
	test(message, function() {
		var $div = $('<div></div>');
		$div.calendar_date_picker(options);
		callback($div);
	});
}

test_with_mock('previous link focuses previous month', { focus_date: new Date(2008, 0, 1) }, function($div) {
	equals($div.find('span.month').text(), 'January', 'prereq (month)');
	equals($div.find('span.year').text(), '2008', 'prereq (year)');
	$div.find('a.previous_month').click();
	equals($div.find('span.month').text(), 'December', 'month');
	equals($div.find('span.year').text(), '2007', 'year');
});

test_with_mock('next link focuses next month', { focus_date: new Date(2008, 11, 1) }, function($div) {
	equals($div.find('span.month').text(), 'December', 'prereq (month)');
	equals($div.find('span.year').text(), '2008', 'prereq (year)');
	$div.find('a.next_month').click();
	equals($div.find('span.month').text(), 'January', 'month');
	equals($div.find('span.year').text(), '2009', 'year');
});

test_with_mock('clicking a link triggers calendar_date_picker:date_selected event', { today_date: new Date(2008, 11, 5) }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function($div, d) {
		equals(+ d - new Date(2008, 11, 5), 0, 'selected December 5');
		n++;
	});
	$div.find('a.today').click();
	equals(n, 1);
});

test_with_mock('clicking a link makes it .selected', { selected_date: new Date(2008, 11, 4), today_date: new Date(2008, 11, 5) }, function($div) {
	$div.find('a.today').click();
	equals($div.find('a.selected')[0], $div.find('a.today')[0]);
});

test_for_required_element('no <td>s are added on last row when month-end is a Saturday', 'tbody tr:eq(4) td', { focus_date: new Date(2009, 0, 1) }, function($elems) {
	equals($elems.length, 7);
});

test_with_mock('clicking a selected link deselects it', { selected_date: new Date(2008, 11, 5), allow_deselect: true }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function(_, d) {
		equals(d, undefined, 'no date passed');
		n++;
	});

	$div.find('a.selected').click();
	equals(n, 1);
});

test_with_mock('deselecting does not work if allow_deselect is false', { selected_date: new Date(2008, 11, 5), allow_deselect: false }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function() { n++; });
	$div.find('a.selected').click();
	equals(n, 0);
});

test_with_mock('sending a select_date signal to the $div sets the date', { selected_date: new Date(2008, 11, 17) }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function() { n++; });
	$div.trigger('calendar_date_picker:select_date', new Date(2008, 11, 18));
	equals(n, 1);
});

test_with_mock('sending a select_date signal to the $div does not signal when the date does not change', { selected_date: new Date(2008, 11, 17) }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function() { n++; });
	$div.trigger('calendar_date_picker:select_date', new Date(2008, 11, 17));
	equals(n, 0);
});

test_with_mock('changing time field will set date', { selected_date: new Date(2009, 0, 23, 1, 0), time_text: 'X' }, function($div) {
	var ret;
	$div.bind('calendar_date_picker:date_selected', function(_, d) { ret = d; });
	$div.find('input').trigger('time_field:set_time', '11:15');
	ok(!(ret - new Date(2009, 0, 23, 11, 15)));
});

test_with_mock('calling select_date will fire set_time on the time field', { selected_date: new Date(2009, 0, 23, 1, 0), time_text: 'X' }, function($div) {
	var ret;
	$div.find('input').bind('time_field:time_changed', function(_, time) { ret = time; });
	$div.trigger('calendar_date_picker:select_date', new Date(2009, 0, 24, 11, 15));
	equals(ret, '11:15');
});

test_with_mock('selecting a new date with time will fire date_selected exactly once', { selected_date: new Date(2009, 0, 23, 1, 0), time_text: 'X' }, function($div) {
	var n = 0;
	$div.bind('calendar_date_picker:date_selected', function() { n++; });
	$div.trigger('calendar_date_picker:select_date', new Date(2009, 0, 24, 11, 15));
	equals(n, 1);
});

test_with_mock('clicking a new date will not change the time', { selected_date: new Date(2009, 0, 23, 11, 15), today_date: new Date(2009, 0, 24, 12, 45), time_text: 'X' }, function($div) {
	var ret;
	$div.bind('calendar_date_picker:date_selected', function(_, d) { ret = d; });
	$div.find('a.today').click();
	ok(!(ret - new Date(2009, 0, 24, 11, 15)));
});

test_with_mock('setting a datetime will set the time in the input field', { today_date: new Date(2009, 0, 26, 9, 52), time_text: 'X' }, function($div) {
	$div.trigger('calendar_date_picker:select_date', new Date(2009, 0, 26, 9, 54));
	equals($div.find('input').val(), '9:54am');
});

});
