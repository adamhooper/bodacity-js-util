function Channeler() {
	this.listeners = {};
	this.requests = {}; // type => XHR
}

(function() {

var channeler;
/*
 * Returns a singleton Channeler, if that is desired.
 *
 * A singleton Channeler should be used when the entire page depends upon the
 * results of channeling requests. On the other hand, separate instances of
 * Channeler should be used when the channeling code is the only code which
 * will listen to results.
 *
 * Broadcasts from one Channeler will not be heard by other Channelers.
 *
 * --
 * Bodacity JavaScript Utilities
 * http://adamhooper.com/bodacity
 * Public Domain (no licensing restrictions)
 */
Channeler.instance = function() {
	if (channeler) return channeler;
	channeler = new Channeler();
	return channeler;
};

})();

/*
 * Broadcasts a message to all listeners of that message type.
 *
 * For example:
 *
 * Channeler.instance().add_listener('com.example.www', function(type, a, b) {
 *   alert(a + b);
 * });
 *
 * Channeler.instance().broadcast('com.example.www', 1, 2); // alerts "3"
 */
Channeler.prototype.broadcast = function(type) {
	if (this.listeners[type]) {
		for (var i = 0; i < this.listeners[type].length; i++) {
			this.listeners[type][i].apply({}, arguments);
		}
	}
};

Channeler.prototype.add_listener = function(type, listener) {
	if (!this.listeners[type]) {
		this.listeners[type] = [];
	}
	for (var i = 0; i < this.listeners[type].length; i++) {
		if (this.listeners[type][i] == listener) return;
	}
	this.listeners[type].push(listener);
};

Channeler.prototype.remove_listener = function(type, listener) {
	if (!this.listeners[type]) return;
	for (var i = this.listeners[type].length; i >= 0; i--) {
		if (this.listeners[type][i] == listener) {
			this.listeners[type].splice(i, 1);
		}
	}
	if (!this.listeners[type].length) {
		delete this.listeners[type];
	}
};

/*
 * Cancels an AJAX request, if it is sending.
 *
 * The Channeler will broadcast a [type].cancel.
 */
Channeler.prototype.abort_channel = function(type) {
	if (this.requests[type]) {
		this.requests[type].abort();
		delete this.requests[type];
		this.broadcast(type + '.cancel');
	}
};

/*
 * Sends an AJAX request.
 *
 * The Channeler will broadcast various messages during the course of each
 * channeling:
 *
 * - [type].send: broadcasts the data before it is sent.
 *                Params: options (i.e., the argument to this method)
 * - [type].success: broadcasts return data from the server if the request
 *                   completed.
 *                   Params: textStatus (String), data (parsed JSON response)
 * - [type].error: broadcasts failure data if the request failed.
 *                 Params: textStatus (null, "timeout", "error", "notmodified",
 *                         "parseerror")
 * - [type].cancel: broadcasts when manually canceling.
 *                  Params: (none)
 * - [type].complete: broadcasts after .success, .error, or .cancel.
 *                    Params: textStatus
 *
 * The UI should not be changed by channel()'s caller: the UI should only be
 * changed in the above-mentioned broadcasts. (When multiple UI components are
 * listening on the same message type, they all must update: not only the
 * caller.)
 *
 * Example call:
 *
 * var n_requests = 0;
 * Channeler.instance().add_listener('ouija_board.sign.send', function(options) {
 *   n_requests++;
 *   $('#error').text('');
 *   if (n_requests == 1) {
 *     $('#status').text('Opening communications with spirits and saying, "' + options.data + '"');
 *   }
 * });
 * Channeler.instance().add_listener('ouija_board.sign.error', function(type, textStatus) {
 *   $('#error').text(textStatus);
 * });
 * Channeler.instance().add_listener('ouija_board.sign.success', function(type, textStatus, data) {
 *   $('#error').text('');
 *   $('#response_text').text(data);
 * });
 * Channeler.instance().add_listener('ouija_board.sign.complete', function(type) {
 *   n_requests--;
 *   if (n_requests == 0) {
 *	   $('#status').text('Resting');
 *	 }
 * });
 *
 * $(':submit').click(function() {
 *   Channeler.instance().channel('ouija_board.sign', { url: '/ouija_board/sign', data: 'ABCD' });
 * });
 *
 * (In the above example, we could put three differently-rendered ouija board
 * representations onto the same page, and all three would follow in the
 * communications.)
 *
 * Calling channel() with the same type as an existing channel will cancel the
 * current request and start a new one. The new request will be started
 * synchronously (i.e., the ".send" message will be broadcast), but the old
 * request will not be ".complete"d synchronously. (You may listen to ".cancel"
 * should you need synchronous feedback.)
 *
 * Valid options (all optional):
 * - data: Data to send to server (either a query string or an Object which
 *         will be converted to one)
 * - dataType: Data type we expect from the server (e.g., 'html' (default))
 * - global: if true (default), fire global ajaxStart/ajaxStop handlers
 * - type: 'GET' (default) or 'POST'
 * - url: URL to request
 */
Channeler.prototype.channel = function(type, options) {
	this.abort_channel(type);

	this.broadcast(type + '.send', options);

	var _this = this;
	var jquery_options = jQuery.extend({
		dataType: 'json',
		success: function(data, textStatus) {
			_this.broadcast(type + '.success', textStatus, data);
		},
		error: function(xhr, textStatus, ex) {
			_this.broadcast(type + '.error', textStatus);
		},
		complete: function(xhr, textStatus) {
			if (xhr == _this.requests[type]) {
				delete _this.requests[type];
			}
			_this.broadcast(type + '.complete', textStatus);
		}
	}, options);

	jquery_options.type = (options.type || '').toUpperCase() == 'POST' ? 'POST' : 'GET';

	this.requests[type] = jQuery.ajax(jquery_options);
};
