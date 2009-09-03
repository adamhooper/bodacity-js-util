(function($) {

/*
 * Turns a <div> into a date picker.
 *
 * The date picker will trigger "calendar_date_picker:date_selected" events,
 * passing a Date object (or null) as the sole parameter. It will also
 * handle "calendar_date_picker:select_date" events, accepting Date objects
 * (or null).
 *
 * OPTIONS
 * - previous_month_text: (default "< Prev") Text for the "previous month" label
 * - next_month_text: (default "Next >") Text for the "next month" label
 * - focus_date: (default today_date) Date on which the calendar should focus.
 *                                    In other words, the month we display to
 *                                    start with.
 * - selected_date: (default null) Selected datetime, with minute or day
 *                                 precision.
 * - today_date: (default now) Today's date
 * - month_texts: (default [ 'January', 'February', ... ]) Text for months
 * - day_of_week_texts: (default [ 'S', 'M', ... ]) Text for days of week
 * - time_text: (default undefined) string label for time-of-day text input
 *              field. If undefined, do not allow time-of-day input.
 * - allow_deselect: (default false) clicking a date selects "undefined"
 *
 * STYLING CONSIDERATIONS
 * The calendar is a <div class="calendar_date_picker"> with the following
 * sub-elements:
 * - table: holds calendar (nesting is for IE styling considerations)
 *   - thead.month: holds month and year information in a single <tr>/<th>
 *     - a.previous_month: flips back one month
 *     - a.next_month: flips forward one month
 *     - span.month: month name
 *     - span.year: year
 *   - thead.days_of_week: holds a <th> per day of the week
 *   - tbody: a <tr> with <td>s containing <a>s with dates
 *     - a.today: today's date (wrapped in a td.today
 *     - a.selected: the selected date (may also be .today), in a td.selected
 *     - a:hover: the date over which the mouse is hovering
 *     - <td>s without <a>s will usually be present
 * - div.time: holds time-of-day label and text (optional)
 *   - label: see options.time_text
 *     - input: input in which one should enter time (will have class
 *              "time_valid" or "time_invalid" depending--see
 *              jquery.time_field.js)
 */
$.fn.calendar_date_picker = function(options) {
	return $(this).each(function() {
		new CalendarDatePicker($(this), options);
	});
};

function CalendarDatePicker($div, options) {
	this.$div = $div;

	this.options = $.extend({
		previous_month_text: '< Prev',
		next_month_text: 'Next >',
		month_texts: [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		],
		day_of_week_texts: [ 'S', 'M', 'T', 'W', 'T', 'F', 'S' ]
	}, options);

	this._extract_options();
	this._redraw();
	this._attach();
}

$.extend(CalendarDatePicker.prototype, {
	_copy_date: function(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	},

	_copy_date_with_time: function(d, time) {
		if (!d) return d;
		var ret = this._copy_date(d);

		var match = (time || '').split(':');
		ret.setHours(+ match[0] || 0);
		ret.setMinutes(+ match[1] || 0);

		return ret;
	},

	_copy_time: function(d) {
		if (!d) return null;
		var hours = '' + d.getHours();
		if (hours.length == 1) {
			hours = '0' + hours;
		}
		var minutes = '' + d.getMinutes();
		if (minutes.length == 1) {
			minutes = '0' + minutes;
		}

		return hours + ':' + minutes;
	},

	_copy_month: function(d) {
		// Copy a date, removing time/day-of-month (so it'll be the 1st)
		return new Date(d.getFullYear(), d.getMonth(), 1);
	},

	_next_month: function(d) {
		return new Date(d.getFullYear(), d.getMonth() + 1, 1);
	},

	_previous_month: function(d) {
		return new Date(d.getFullYear(), d.getMonth() - 1, 1);
	},

	_next_date: function(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, d.getHours(), d.getMinutes());
	},

	_extract_options: function() {
		this.today_date = this._copy_date(this.options.today_date || new Date());

		if (this.options.selected_date) {
			this.selected_date = this._copy_date(this.options.selected_date);
		}

		this.focus_date = this._copy_month(this.options.focus_date || this.selected_date || this.today_date);

		this.time = this._does_datetime() ? this._copy_time(this.options.selected_date || this.options.today_date || new Date()) : '00:00';
	},

	_create_calendar: function() {
		var _this = this;

		var $table = $('<table></table>');

		var $thead_month = $('<thead class="month"><tr><th colspan="7"><a class="previous_month" href="#"></a><a class="next_month" href="#"></a><span class="month"></span> <span class="year"></span></th></tr></thead>');
		$thead_month.find('a.previous_month').text(this.options.previous_month_text);
		$thead_month.find('a.previous_month').click(function(e) {
			_this._on_previous_month_clicked();
			e.preventDefault();
		});
		$thead_month.find('span.month').text(this.options.month_texts[this.focus_date.getMonth()]);
		$thead_month.find('span.year').text(this.focus_date.getFullYear());
		$thead_month.find('a.next_month').text(this.options.next_month_text);
		$thead_month.find('a.next_month').click(function(e) {
			_this._on_next_month_clicked();
			e.preventDefault();
		});
		$table.append($thead_month);

		var $thead2 = $('<thead class="days_of_week"><tr></tr></thead>');
		$.each(this.options.day_of_week_texts, function(i, text) {
			var $th = $('<th></th>');
			$th.text(text);
			$thead2.children('tr').append($th);
		});
		$table.append($thead2);

		var $tbody = $('<tbody></tbody>');
		var $tr = $('<tr></tr>');
		var d = this._copy_date(this.focus_date);
		for (var i = 0; i < d.getDay(); i++) {
			$tr.append('<td></td>');
		}
		for (; d.getMonth() == this.focus_date.getMonth(); d = this._next_date(d)) {
			if ($tr.children().length == 7) {
				$tbody.append($tr);
				$tr = $('<tr></tr>');
			}

			var cell_classes = [];
			if (this.selected_date && !(d - this.selected_date)) {
				cell_classes.push('selected');
			}
			if (!(d - this.today_date)) {
				cell_classes.push('today');
			}
			var cell_class_string;
			if (cell_classes.length) {
				cell_class_string = ' class="' + cell_classes.join(' ') + '"';
			} else {
				cell_class_string = '';
			}

			var $td = $('<td' + cell_class_string + '><a href="#"' + cell_class_string + '>' + d.getDate() + '</a></td>');
			var $a = $td.children();
			$a.click(function(e) {
				e.preventDefault();
				var d = _this._copy_date_with_time($(this).data('date.calendar_date_picker'), _this.time);
				if (_this.options.allow_deselect && _this.selected_date && !(d - _this.selected_date)) {
					_this.select_date(undefined);
				} else {
					_this.select_date(d);
				}
			});
			$a.data('date.calendar_date_picker', d);
			$tr.append($td);
		}
		for (var j = d.getDay(); j && j < 7; j++) {
			$tr.append('<td></td>');
		}
		$tbody.append($tr);

		$table.append($tbody);

		return $table;
	},

	_refresh_calendar_table_classes: function($table) {
		var selected = this.selected_date;
		var selected_class = 'selected';

		$table.find('a.selected').each(function() {
			$(this).removeClass(selected_class);
			$(this).parent().removeClass(selected_class);
		});

		$table.find('tbody a').each(function() {
			var $a = $(this);
			var $td = $a.parent();

			var a_date = $a.data('date.calendar_date_picker');

			if (selected && !(a_date - selected)) {
				$a.addClass(selected_class);
				$td.addClass(selected_class);
			}
		});
	},

	_attach: function() {
		var _this = this;

		this.$div.bind('calendar_date_picker:select_date', function(_, d) {
			_this.select_date(d);
		});
	},

	_does_datetime: function() {
		return this.options.time_text !== undefined;
	},

	_on_previous_month_clicked: function() {
		this.focus_date = this._previous_month(this.focus_date);
		this._refresh_calendar();
	},

	_on_next_month_clicked: function() {
		this.focus_date = this._next_month(this.focus_date);
		this._refresh_calendar();
	},

	_redraw: function() {
		var _this = this;

		this.$div.empty();

		var $div = $('<div class="calendar_date_picker"></div>');

		var $table = this._create_calendar();
		$div.append($table);

		if (this._does_datetime()) {
			var $label = $('<label></label>').text(this.options.time_text);
			var $time_field = $('<input type="text"/>');
			$time_field.time_field({ on_invalid: '00:00' });
			$time_field.trigger('time_field:set_time', this.time);

			$time_field.bind('time_field:time_changed', function(_, time) {
				var d = _this._copy_date_with_time(_this.selected_date, time);
				_this.select_date(d);
			});

			$label.append($time_field);
			var $time_div = $('<div class="time"></div>');
			$time_div.append($label);
			$div.append($time_div);
		}

		this.$div.append($div);
	},

	_refresh_calendar: function() {
		var $table = this._create_calendar();

		this.$div.find('table').remove(); // if we have one
		this.$div.children('div.calendar_date_picker').prepend($table);
	},

	select_date: function(d) {
		var new_date = d ? this._copy_date(d) : undefined;
		var new_time = d ? this._copy_time(d) : undefined;

		var v1 = this.selected_date ? this.selected_date.valueOf() : undefined;
		var v2 = new_date ? new_date.valueOf() : undefined;
		if (v1 == v2 && new_time == this.time) return;

		this.selected_date = new_date;
		if (this._does_datetime()) {
			this.time = new_time;

			// set_time will try to recurse, but since we just set the date and time
			// the next call to select_date() will be a no-op.
			this.$div.find('input').trigger('time_field:set_time', new_time);
		}
		this.$div.trigger('calendar_date_picker:date_selected', [this._copy_date_with_time(this.selected_date, this.time)]);

		this._refresh_calendar_table_classes(this.$div.find('table'));
	}
});

})(jQuery);
