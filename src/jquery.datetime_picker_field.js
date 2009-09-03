(function($) {

/*
 * Turns a text field into an interactive date/time picker.
 *
 * Dependencies: jquery.calendar_date_picker.js
 *
 * Required Options:
 *   parse_callback: function which accepts a String (from the text field) and
 *                   returns a Date (for use in datetime_picker_field) or null
 *                   if the string does not represent a date.
 *   format_callback: function which accepts a Date (from datetime_picker_field)
 *                    or null and returns a String (for the text field).
 *   open_calendar_callback: function called after opening the calendar.
 *   close_calendar_callback: function called after closing the calendar.
 *
 * Extra Options:
 *   calendar (default {}): options to pass to calendar_date_picker().
 *   surrounding_element (default $('body')): where to insert the calendar div.
 */
$.fn.datetime_picker_field = function(options) {
	return this.each(function() {
		new DatetimePickerField($(this), options);
	});
};

function DatetimePickerField($field, options) {
	this.$field = $field;
	this.$calendar = undefined;

	this.options = $.extend({
		calendar: {}
	}, options);

	this._in_manual_edit = false;
	this._blurs_to_ignore = -1; // -1 when inactive, 0 when we should hide

	this._attach();
}

$.extend(DatetimePickerField.prototype, {
	_attach: function() {
		var _this = this;

		this.$field.focus(function() {
			_this._in_time_field = false;
			_this._ensure_calendar();
		});
		this.$field.blur(function() {
			_this._hide_calendar_or_refocus();
			_this._blurs_to_ignore -= 1;
		});
		$.each(['keypress', 'cut', 'paste', 'input'], function() {
			_this.$field.bind(this, function() {
				_this._handle_edit();
			});
		});
	},

	/*
	 * Returns a calendar-ized div, creating a new one if necessary.
	 *
	 * Postcondition: this.$calendar is set.
	 */
	_ensure_calendar: function() {
		if (this.$calendar) return this.$calendar;

		var _this = this;

		var $c = $('<div></div>');
		$c.css('position', 'absolute');
		$c.css('left', this.$field.offset().left + this.$field.width() + 20);
		$c.css('top', this.$field.offset().top);

		$c.hide();
		this._get_surrounding_element().append($c);

		var calendar_options = $.extend({
			selected_date: this.get_selected_datetime()
		}, this.options.calendar);
		$c.calendar_date_picker(calendar_options);

		$c.mousedown(function(e) {
			_this._in_time_field = false;
			_this._blurs_to_ignore += 1;
		});

		$c.find('label').mousedown(function(e) {
			_this._in_time_field = true;
			_this._blurs_to_ignore += 1;
			e.stopPropagation();
		});
		$c.find('input').blur(function() {
			_this._hide_calendar_or_refocus();
			_this._blurs_to_ignore -= 1;
		});

		_this._blurs_to_ignore = 0;

		$c.bind('calendar_date_picker:date_selected', function(_, d) {
			// In here, we have not yet re-focused the text field. So if the field
			// has focus, that's because the user is not using the calendar.
			if (!_this._in_manual_edit) {
				var s = _this.options.format_callback(d);
				if (s != _this.$field.val()) {
					_this.$field.val(s);
					_this.$field.trigger('input');
				}
			}
		});

		this.$calendar = $c;

		$c.fadeIn();
		if (this.options.open_calendar_callback) {
			this.options.open_calendar_callback();
		}

		return this.$calendar;
	},

	/*
	 * Hides and destroys this.$calendar if it is set.
	 *
	 * Postcondition: this.$calendar is undefined.
	 */
	_hide_calendar: function() {
		if (!this.$calendar) return;

		this.$calendar.fadeOut(function() {
			$(this).remove();
		});

		this.$calendar = undefined;

		if (this.options.close_calendar_callback) {
			this.options.close_calendar_callback();
		}
	},

	/*
	 * Reformats the value in a format Rails can read.
	 */
	_reformat_value: function() {
		this.$field.val(this.options.format_callback(this.get_selected_datetime()));
	},

	/*
	 * Either calls _hide_calendar() or refocuses the last-focused text input,
	 * depending on whether our last blur actually took us off the calendar.
	 *
	 * Called within a blur() event
	 */
	_hide_calendar_or_refocus: function() {
		var _this = this;

		if (this._blurs_to_ignore <= 0) {
			this._hide_calendar();
			this._reformat_value();
		} else {
			window.setTimeout(function() {
				if (_this._in_time_field) {
					if (_this.$calendar.length) {
						_this.$calendar.find('input').focus();
					}
				} else {
					_this.$field.focus();
				}
			});
		}
	},

	_handle_edit: function() {
		this._in_manual_edit = true;
		if (this.$calendar) {
			this.$calendar.trigger('calendar_date_picker:select_date', this.get_selected_datetime());
		}
		this._in_manual_edit = false;
	},

	/*
	 * Returns the currently selected datetime.
	 */
	get_selected_datetime: function() {
		var s = this.$field.val();
		return this.options.parse_callback(s);
	},

	_get_surrounding_element: function() {
		if (this.options.surrounding_element) {
			return $(this.options.surrounding_element);
		} else {
			return $('body');
		}
	}
});

})(jQuery);
