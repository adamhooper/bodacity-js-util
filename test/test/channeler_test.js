$(document).ready(function() {

module('channeler.js');

test('Channeler.instance() exists', function() {
	ok($.isFunction(Channeler.instance));
});

function test_with_ch(message, callback) {
	test(message, function() {
		var ch = new Channeler();
		callback(ch);
	});
}

function test_ch_channel_options(message, options, validation_block) {
	test_with_ch(message, function(ch) {
		stub_ajax('X', function() {
			ch.channel('com.blah', options);
		}, validation_block);
	});
}

test_with_ch('ch.broadcast() exists', function(ch) {
	ok($.isFunction(ch.broadcast));
});

test_with_ch('ch.add_listener() exists', function(ch) {
	ok($.isFunction(ch.add_listener));
});

test_with_ch('add_listener() listens to broadcasts', function(ch) {
	var n = 0;
	ch.add_listener('com.blah', function() { n++; });
	ch.broadcast('com.blah');
	equals(1, n);
});

test_with_ch('remove_listener() stops listening to broadcasts', function(ch) {
	var n = 0;
	var fn = function() { n++; };
	ch.add_listener('com.blah', fn);
	ch.remove_listener('com.blah', fn);
	ch.broadcast('com.blah');
	equals(0, n);
});

test_with_ch('listeners do not get called with non-subscribed message types', function(ch) {
	var n = 0;
	ch.add_listener('abcd.efg', function() { n++; });
	ch.broadcast('com.blah');
	equals(0, n);
});

test_with_ch('listeners get called with message type as first parameter', function(ch) {
	ch.add_listener('com.blah', function(type) { equals('com.blah', type); });
	ch.broadcast('com.blah');
});

test_with_ch('listeners get broadcast argument as second parameter', function(ch) {
	ch.add_listener('com.blah', function(_, m) { equals('X', m); });
	ch.broadcast('com.blah', 'X');
});

test_with_ch('broadcast can send multiple arguments', function(ch) {
	ch.add_listener('com.blah', function(_, a1, a2) { equals('X', a1); equals('Y', a2); });
	ch.broadcast('com.blah', 'X', 'Y');
});

test_with_ch('ch.channel() exists', function(ch) {
	ok($.isFunction(ch.channel));
});

test_with_ch('ch.channel() broadcasts "[namespace].send" when sending', function(ch) {
	var n = 0;
	ch.add_listener('com.blah.send', function(type, message) {
		n++;
		equals('com.blah.send', type, 'broadcast message type');
		equals('Y', message.data);
	});

	stub_ajax('X', function() {
		ch.channel('com.blah', { data: 'Y' });
	});

	equals(1, n, 'listener was invoked');
});

test_with_ch('ch.channel() broadcasts "[namespace].success" on success', function(ch) {
	var n = 0;
	ch.add_listener('com.blah.success', function(type, textStatus, data) {
		n++;
		equals('com.blah.success', type);
		ok(textStatus, 'textStatus is set');
		equals('X', data);
	});

	stub_ajax('X', function() {
		ch.channel('com.blah', { data: 'Y' });
	});

	equals(1, n, 'listener was invoked');
});

test_with_ch('ch.channel() broadcasts "[namespace].complete" on success', function(ch) {
	var n = 0;
	ch.add_listener('com.blah.complete', function(type, textStatus) {
		n++;
		equals('com.blah.complete', type);
		ok(textStatus);
	});

	stub_ajax('X', function() {
		ch.channel('com.blah', { data: 'Y' });
	});

	equals(1, n, 'listener was invoked');
});

test_with_ch('ch.channel() broadcasts "[namespace].error" on error', function(ch) {
	var n = 0;
	ch.add_listener('com.blah.error', function(type, textStatus) {
		n++;
		equals('com.blah.error', type);
		equals('timeout', textStatus);
	});

	stub_ajax('X', function() {
		ch.channel('com.blah', { data: 'Y' });
	}, undefined, 'timeout');

	equals(1, n, 'listener was invoked');
});

test_with_ch('ch.channel() broadcasts "[namespace].complete" on error', function(ch) {
	var n = 0;
	ch.add_listener('com.blah.complete', function(type, textStatus) {
		n++;
		equals('com.blah.complete', type);
		equals('timeout', textStatus);
	});

	stub_ajax('X', function() {
		ch.channel('com.blah', { data: 'Y' });
	}, undefined, 'timeout');

	equals(1, n, 'listener was invoked');
});

test_with_ch('ch.channel() cancels AJAX request when another channel() comes in', function(ch) {
	ok(true, 'FIXME: untested');
});

test_with_ch('ch.abort_channel() aborts an AJAX request', function(ch) {
	ok(true, 'FIXME: untested');
});

test_ch_channel_options('ch.channel() passes URL to $.ajax', { url: '/search' }, function(o) {
	equals('/search', o.url);
});

test_ch_channel_options('ch.channel() passes data to $.ajax', { data: 'a=b&c=d' }, function(o) {
	equals('a=b&c=d', o.data);
});

test_ch_channel_options('ch.channel() passes dataType of "json"', {}, function(o) {
	equals('json', o.dataType);
});

test_ch_channel_options('ch.channel() passes GET by default', {}, function(o) {
	equals('GET', o.type);
});

test_ch_channel_options('ch.channel() allows POSTing', { type: 'POST' }, function(o) {
	equals('POST', o.type);
});

test_ch_channel_options('ch.channel() POSTS when passed lowercase type', { type: 'post' }, function(o) {
	equals('POST', o.type);
});

test_ch_channel_options('ch.channel() GETs when passed an invalid type', { type: 'asdfa' }, function(o) {
	equals('GET', o.type);
});

});
