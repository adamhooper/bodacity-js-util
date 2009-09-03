(function($) {

window.mock_html = function(html) {
	$('#mocks').append(html);
};

window.unmock_all = function() {
	$('#mocks').empty();
};

/*
 * Stubs out jQuery.ajax so that it will pass the given retval to its callback,
 * optionally verifying the expected parameters.
 *
 * The callback will be called synchronously, even for async requests.
 *
 * Params:
 * - retval: what to pass to the callback block
 * - block: what to run while the method is stubbed
 * - validate_params_block: function which accepts the params given to $.ajax()
 *   and calls equals()/ok() to verify that all arguments are as desired
 * - expected_s: params with which the code should call $.ajax(). Null to
 *   accept any params from block.
 * - if not-undefined, specifies an error string
 *
 * Returns: The number of times jQuery.ajax() was called
 */
window.stub_ajax = function(retval, block, validate_params_block, error) {
  var old_ajax = jQuery.ajax;
  var ret = 0;
  jQuery.ajax = function(s) {
    ret++;
    if (validate_params_block) {
      validate_params_block(s);
    }

    if (error !== undefined) {
      if (s.error) {
        s.error('STUB XMLHttpRequest', error);
      }
    } else {
      if (s.success) {
        s.success(retval, '200 OK');
      }
    }
    if (s.complete) {
      s.complete('STUB XMLHttpRequest', error === undefined ? '200 OK' : error);
    }
  };
  block();
  jQuery.ajax = old_ajax;
  return ret;
};

window.disable_animations = function(callback) {
	var off = $.fx.off;
	$.fx.off = true;
	callback();
	$.fx.off = off;
};

})(jQuery);
