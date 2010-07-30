(function($) {

/*
 * Turns an input field into a time-of-day field.
 *
 * A time-of-day field behaves like a regular text field, but it triggers
 * events as the user edits it. Time is stored internally and passed in events
 * with a 24-hour clock, but is displayed as "h:mmpm".
 *
 * Events:
 *  - time_field:set_time: pass in a string of format "hh:mm" (24-hour clock)
 *  - time_field:time_changed: fires with a string of format "hh:mm" (24-hour)
 *  (false values are allowed in set_time; time_changed will emit null when the
 *  time is invalid.)
 *
 * Options:
 *  - on_invalid (default null): what should be passed around when the time
 *                               cannot be parsed (e.g., a default value,
 *                               "00:00")
 *
 * --
 * Bodacity JavaScript Utilities
 * http://adamhooper.com/bodacity
 * Public Domain (no licensing restrictions)
 */
$.fn.time_field = function(options) {
	return $(this).each(function() {
		new TimeField($(this), options);
	});
};

function TimeField($field, options) {
	this.$field = $field;

	this.options = $.extend({
		on_invalid: null
	}, options);

	this._value = this._current_time_from_field();

	this._attach();
}

$.extend(TimeField.prototype, {
	_attach: function() {
		var _this = this;

		_this.$field.bind('keypress cut paste input', function() {
			_this._handle_edit();
		});

		this.$field.bind('time_field:set_time', function(_, t) {
			_this.set_time(t);
		});
	},

	_s_to_time: function(s) {
		var re = /^\s*(\d\d?)(:(\d\d))?\s*([ap]m?)?\s*$/i;
		var match = s.match(re);
		var ret;

		var invalid = !match;

		if (!invalid) {
			var hours = (+ match[1]) % 12;
			var minutes = + match[3] || 0;
			var pm = (match[4] || '').match(/p/i);

			if (!match[4]) {
				pm = + match[1] >= 12;
			}

			if (+ match[1] > 23) invalid = true;
			if (+ match[1] > 12 && match[4]) invalid = true;
			if (minutes > 59) invalid = true;
			if (+ match[1] < 1 && match[4]) invalid = true;

			var hour_for_display = '' + (hours + (pm ? 12 : 0));
			if (hour_for_display.length == 1) {
				hour_for_display = '0' + hour_for_display;
			}

			var minute_for_display = '' + minutes;
			if (minute_for_display.length == 1) {
				minute_for_display = '0' + minute_for_display;
			}

			ret = hour_for_display + ':' + minute_for_display;
		}

		return invalid ? this.options.on_invalid : ret;
	},

	_time_to_s: function(time) {
		var match = time && time.match(/(\d\d):(\d\d)/);
		if (match) {
			var hours = +match[1];
			var minutes = +match[2];
			var pm = hours >= 12 ? 'pm' : 'am';

			var hour_for_display = '' + (hours % 12 ? hours % 12 : 12);
			var minute_for_display = '' + minutes;

			if (minute_for_display.length == 1) {
				minute_for_display = '0' + minute_for_display;
			}

			return hour_for_display + ':' + minute_for_display + pm;
		} else {
			return '';
		}
	},

	_current_time_from_field: function() {
		return this._s_to_time(this.$field.val());
	},

	_reset_field_value: function() {
		if (this._value != this._current_time_from_field()) {
			this.$field.val(this._time_to_s(this._value));
		}
	},

	set_time: function(new_value, skip_reset_field) {
		if (new_value != this._value) {
			this._value = new_value;
			this.$field.trigger('time_field:time_changed', this._value);
		}
		this._reset_field_value();
	},

	_handle_edit: function() {
		var new_value = this._current_time_from_field();
		this.set_time(new_value);
	}
});

})(jQuery);
