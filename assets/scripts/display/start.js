// Create the display instance
window.display = new DisplayClass();

(function() {

	/**
	 * Sorter function for the element arrays
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	function sorter(a, b) {
		if (a.x < b.x) {
			return -1;
		}

		if (a.x > b.x) {
			return 1;
		}

		if (a.y < b.y) {
			return -1;
		}

		if (a.y > b.y) {
			return 1;
		}

		return 0;
	}

	function closest(el, query) {

		var p = el,
		    o;

		// Try getting from the children
		o = p.querySelector(query);

		if (o) {
			return o;
		}

		// Not found among the children, look up
		while (p !== null) {
			o = p;

			if (o.matches(query)) {
				return o;
			}

			p = o.parentElement;
		}

		return null;
	}

	/**
	 * Keydown event listener, does all the magic
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	document.addEventListener('keydown', function onKeydown(event) {

		var top_element,
		    active_rect,
		    other_arr,
		    elements,
		    element = document.activeElement,
		    rect,
		    temp,
		    arr,
		    el,
		    x,
		    y,
		    i;

		// Listen for backspaces
		if (event.keyCode == 8) {
			top_element = closest(document.elementFromPoint(1, 1), '.js-he-dialog-wrapper');

			if (top_element) {
				top_element.remove();
				event.preventDefault();
			}

			return;
		}

		// Listen for enters
		if (event.keyCode == 13 && element.matches('[tabindex]')) {
			return element.click();
		}

		// Only listen to arrow keys, ignore the rest
		if (event.keyCode < 37 || event.keyCode > 40) {
			return;
		}

		// Get the measurements of the active element
		active_rect = element.getBoundingClientRect();

		// Get the element on top
		top_element = closest(document.elementFromPoint(1, 1), '.hover-group');

		if (!top_element) {
			return;
		}

		// Get all the other elements with a `tabindex` attribute
		elements = top_element.querySelectorAll('[tabindex]');

		// Possible candidates will go in this array
		arr = [];

		// Discarded elements go in here,
		// only used when moving from one edge to another
		other_arr = [];

		// If nothing (ie the body) has focus,
		// just set the first available element
		if (element == document.body) {
			if (elements[0]) {
				elements[0].focus();
			}

			return;
		}

		// Go over all the elements that have a tabindex
		for (i = 0; i < elements.length; i++) {

			// Get the element
			el = elements[i];

			// Get the measurements
			rect = el.getBoundingClientRect();

			// Reset the x & y variable
			x = null;
			y = null;

			// Main X or Y calculation
			if (event.keyCode == 39) {
				// arrow right
				x = rect.left - active_rect.right;
			} else if (event.keyCode == 37) {
				// arrow left
				x = active_rect.left - rect.right;
			} else if (event.keyCode == 38) {
				// arrow up
				y = active_rect.top - rect.bottom;
			} else if (event.keyCode == 40) {
				// arrow down
				y = rect.top - active_rect.bottom;
			}

			// Create the temp object
			temp = {
				x: x,
				y: y,
				el: el
			};

			// Calculate the other coordinate
			if (y == null) {
				temp.y = Math.abs(active_rect.top - rect.top);

				// If X is smaller than 0, it's on the wrong side
				if (x < 0) {
					other_arr.push(temp)
					continue;
				}
			} else {
				temp.x = Math.abs(active_rect.left - rect.left);

				// If Y is smaller than 0, it's on the wrong side
				if (y < 0) {
					other_arr.push(temp)
					continue;
				}
			}

			// If we've gotten this far, this element is
			// a possible candidate
			arr.push(temp);
		}

		// Sort the elements:
		// the closer they are, the higher they end up on the list
		arr.sort(sorter);

		// Focus on the closes element, if there is one
		if (arr[0]) {
			arr[0].el.focus();
		} else {
			// We're at the edge,
			// so sort the other candidates ...
			other_arr.sort(sorter);

			// And focus on that first one
			other_arr[0].el.focus();
		}
	}, false);
}());

hawkejs.scene.on({type: 'set', template: 'display/start'}, function applyField(element, variables) {

	var $element = $(element);

	// Listen to tabindex click events
	$element.on('click', '[tabindex]', function onClick(e) {

		var $action = $(this);

		if ($action.data('href')) {
			display.openUrl($action.data('href'));
		}
	});
});

hawkejs.scene.on({type: 'set', category: 'dialog'}, function onDialog(element) {
	//console.log('Opened new dialog:', element);
});

hawkejs.scene.on({type: 'remove', category: 'dialog'}, function onDialogRemoved(element) {
	display.resetActive();
});

// Bind to elements with the data-event attribute
hawkejs.constructor.onAttribute('data-event', function onDisplayDataEvent(element, value, old_value, created) {

	if (value == old_value || !value) {
		return;
	}

	// @todo: this gets called twice for some reason upon the first render...
	if (element.has_data_event) {
		return;
	}

	element.has_data_event = true;

	element.addEventListener('click', function onClick(e) {

		var value,
		    i;

		// Get the event string
		value = this.getAttribute('data-event').split('|').map(function eachEntry(str) {
			return str.trim();
		});

		e.preventDefault();

		display.doEvent(value);
	});
});