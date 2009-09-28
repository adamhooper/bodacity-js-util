(function($) {

var undefined; // help minification

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
	return this.each(function() {
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
	this._attach();

	this._redraw();
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

	_previous_date: function(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, d.getHours(), d.getMinutes());
	},

	_same_year: function(d1, d2) {
		return d1.getFullYear() == d2.getFullYear();
	},

	_same_month: function(d1, d2) {
		return this._same_year(d1, d2) && d1.getMonth() == d2.getMonth();
	},

	_last_date_of_month: function(d) {
		return new Date(d.getFullYear(), d.getMonth() + 1, 0);
	},

	_selected_date_date_in_focus_month: function() {
		if (this.selected_date && this._same_month(this.selected_date, this.focus_date)) {
			return this.selected_date.getDate();
		} else {
			return undefined;
		}
	},

	_extract_options: function() {
		this.today_date = this._copy_date(this.options.today_date || new Date());

		if (this.options.selected_date) {
			this.selected_date = this._copy_date(this.options.selected_date);
		}

		this.focus_date = this._copy_month(this.options.focus_date || this.selected_date || this.today_date);

		this.time = this._does_datetime() ? this._copy_time(this.options.selected_date || this.options.today_date || new Date()) : '00:00';
	},

	_refresh_calendar_table_classes: function($table) {
		var selected_class = 'selected';

		var selected_d = this._selected_date_date_in_focus_month();

		var $tbody = $table.children('tbody');

		var $old_selected_a = $tbody.find('a.selected');
		$old_selected_a.removeClass(selected_class);
		$old_selected_a.parent().removeClass(selected_class);

		var $new_selected_a = $tbody.find('a:eq(' + (selected_d - 1) + ')');
		$new_selected_a.addClass(selected_class);
		$new_selected_a.parent().addClass(selected_class);
	},

	_attach: function() {
		var _this = this;

		this.$div.bind('calendar_date_picker:select_date', function(_, d) {
			_this.select_date(d);
		});
	},

	_bind_dom_table_events: function() {
		var _this = this;

		var $table = this.$div.children().children('table');
		var $thead_month = $table.children(':eq(0)');
		var $th = $thead_month.children().children();
		var $previous_month_a = $th.children('a.previous_month');
		$previous_month_a.text(this.options.previous_month_text);
		$previous_month_a.click(function(e) {
			e.preventDefault();
			_this._on_previous_month_clicked();
		});
		var $next_month_a = $th.children('a.next_month');
		$next_month_a.text(this.options.next_month_text);
		$next_month_a.click(function(e) {
			e.preventDefault();
			_this._on_next_month_clicked();
		});

		var $tbody = $table.children('tbody');

		$tbody.click(function(e) {
      var originating_element;
      if($.browser.msie) {
        originating_element = e.srcElement;
      } else {
        originating_element = e.originalTarget;
      }
 
      var $a = $(originating_element);
			if ($a[0] && $a[0].nodeName == 'A') {
				e.preventDefault();

				var d = _this._copy_date_with_time(_this.focus_date, _this.time);
				d.setDate(+ $a.text());

				var selected_datetime = _this._copy_date_with_time(_this.selected_date, _this.time);

				if (_this.options.allow_deselect && selected_datetime && !(d - selected_datetime)) {
					_this.select_date(undefined);
				} else {
					_this.select_date(d);
				}
			}
		});
	},

	_bind_dom_time_events: function() {
		if (this._does_datetime()) {
			var _this = this;
			var $time_field = this.$div.children().children('div.time').find('input');
			$time_field.time_field({ on_invalid: '00:00' });
			$time_field.trigger('time_field:set_time', this.time);

			$time_field.bind('time_field:time_changed', function(_, time) {
				var d = _this._copy_date_with_time(_this.selected_date, time);
				_this.select_date(d);
			});
		}
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

		this.$div.append('<div class="calendar_date_picker">' + this._table_html() + this._time_div_html() + '</div>');

		this._bind_dom_table_events();
		this._bind_dom_time_events();
	},

	_refresh_calendar: function() {
		this.$div.children().children('table').replaceWith(this._table_html());
		this._bind_dom_table_events();
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
	},

	_table_html: function() {
		return '<table>' + this._thead_month_html() + this._thead_days_of_week_html() + this._tbody_html() + '</table>';
	},

	_thead_month_html: function() {
		return '<thead class="month"><tr><th colspan="7"><a class="previous_month" href="#"></a><a class="next_month" href="#"></a><span class="month">' + escape_html(this.options.month_texts[this.focus_date.getMonth()]) + '</span> <span class="year">' + this.focus_date.getFullYear() + '</span></th></tr></thead>';
	},

	_thead_days_of_week_html: function() {
		return '<thead class="days_of_week"><tr><th>' + this._days_of_week_ths().join('</th><th>') + '</th></tr></thead>';
	},

	_tbody_html: function() {
		var first_day_of_week = this._copy_month(this.focus_date).getDay();
		var cur_d = 1;
		var last_d = this._last_date_of_month(this.focus_date).getDate();
		var selected_d = this._selected_date_date_in_focus_month();
		var today_d = this._same_month(this.focus_date, this.today_date) && this.today_date.getDate();

		var td_collections = [];

		td_collections.push(this._date_tds(first_day_of_week, selected_d, today_d, cur_d, last_d));

		for (cur_d = 8 - first_day_of_week; cur_d <= last_d; cur_d += 7) {
			td_collections.push(this._date_tds(0, selected_d, today_d, cur_d, last_d));
		}

		return '<tbody><tr>' + td_collections.join('</tr><tr>') + '</tr></tbody>';
	},

	_date_tds: function(n_skip_cells, selected_d, today_d, first_d, last_d) {
		var tds = [];

		var empty_td = '<td></td>';
		for (var i = 0; i < n_skip_cells; i++) {
			tds.push(empty_td);
		}

		for (var d = first_d; tds.length < 7 && d <= last_d; d++) {
			var cell_classes = [];
			if (d === selected_d) {
				cell_classes.push('selected');
			}
			if (d === today_d) {
				cell_classes.push('today');
			}
			var cell_class_string;
			if (cell_classes.length) {
				cell_class_string = ' class="' + cell_classes.join(' ') + '"';
			} else {
				cell_class_string = '';
			}

			var td = '<td' + cell_class_string + '><a href="#"' + cell_class_string + '>' + d + '</a></td>';

			tds.push(td);
		}

		for (var j = last_d + 1; j < first_d + 7; j++) {
			tds.push(empty_td);
		}

		return tds.join('');
	},

	_days_of_week_ths: function() {
		var _this = this;
		var strs = $.map(this.options.day_of_week_texts, escape_html);
		return strs;
	},

	_time_div_html: function() {
		if (this._does_datetime()) {
			return '<div class="time"><label>' + escape_html(this.options.time_text) + '<input type="text" /></label></div>';
		} else {
			return '';
		}
	}
});

var _escape_html_elem;
function escape_html(s) {
	if (!_escape_html_elem) {
		_escape_html_elem = document.createElement('div');
		_escape_html_elem.appendChild(document.createTextNode(s));
	} else {
		_escape_html_elem.firstChild.nodeValue = s;
	}
	return _escape_html_elem.innerHTML;
}

})(jQuery);
