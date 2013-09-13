range.js
========

## Simple Javascript/jQuery fallback for HTML5 range slider.

Mimics the HTML5 Range slider functionality.
Works with keyboard arrow keys.
Simple, no frills.

```javascript
	/*
	 * Range feature detection
	 * Could use Modernizr here
	 * @returns {Boolean}
	 */
	function supportsRange() {
	    var i = document.createElement("input");
	    i.setAttribute("type", "range");
	    return i.type !== "text";
	}
	
	if (!supportsRange()) {
	
	    //create JS range slider
	    $('input[name="slider"]').Range();
	
	    //slider dispatches 'change' event
	    $('input[name="slider"]').on('change', function(e, slider) {
	        console.log($(this).val());
	    });
	}
```

##### Tested in
lastest Chrome, FF, IE8/9, Safari 5/6.

##### Dependencies.
jQuery
