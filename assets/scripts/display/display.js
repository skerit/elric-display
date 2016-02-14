/**
 * The client-side Display class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var DisplayClass = Function.inherits('Informer', 'Elric', function Display() {
	console.info('Created Display instance');

	// Get live list of all hover-groups
	this.open_screens = document.getElementsByClassName('hover-group');

	// Get the enclosure
	this.enclosure = document.getElementsByClassName('enclosure')[0];

	// Create the main video player
	this.video_player = new VideoPlayer(true);
});

/**
 * The current active element (null if body)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setProperty(function element() {

	if (document.activeElement !== document.body) {
		return document.activeElement;
	}

	return null;
});

/**
 * The current active screen
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setProperty(function screen() {

	// If there are open screens, return the last one
	if (this.open_screens.length) {
		return this.open_screens[this.open_screens.length - 1];
	}

	return this.enclosure;
});

/**
 * The current inactive screens
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {Array}
 */
DisplayClass.setProperty(function inactive_screens() {

	var result = [],
	    i;

	// If there are open screens, return the last one
	if (this.open_screens.length) {
		for (i = 0; i < this.open_screens.length - 1; i++) {
			result.push(this.open_screens[i]);
		}
	}

	return result;
});

/**
 * Remove focus from the current active element
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setMethod(function blur() {
	if (this.element) {
		this.element.blur();
	}
});

/**
 * Get the closest element matching the query
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setMethod(function closestElement(element, query) {

	var p = element,
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
});

/**
 * Reset the active/inactive classes
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setMethod(function resetActive() {

	var active_screen = this.screen,
	    inactive_screens = this.inactive_screens,
	    element,
	    i;

	for (i = 0; i < inactive_screens.length; i++) {
		element = inactive_screens[i];

		// Make sure the active class is removed (if it's there)
		element.classList.remove('active-screen');

		// Add the inactive class
		element.classList.add('inactive-screen');
	}

	// Now set the active screen
	active_screen.classList.remove('inactive-screen');
	active_screen.classList.add('active-screen');
});

/**
 * Go back a screen
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
DisplayClass.setMethod(function goBack() {

	var parent;

	if (this.inactive_screens.length) {

		parent = this.closestElement(this.screen, '.js-he-dialog-wrapper');

		if (parent) {
			parent.remove();
			this.resetActive();
		}
	}
});

/**
 * Open a url without modifying history
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {URL|String}   url
 * @param   {Object}       options
 * @param   {Function}     callback   Called when rendering is complete
 */
DisplayClass.setMethod(function openUrl(url, options, callback) {

	var that = this;

	if (typeof options == 'function') {
		callback = options;
		options = null;
	}

	if (!options) {
		options = {};
	}

	// Remove focus from current active element
	this.blur();

	// Open the url without modifying history
	// @todo: allow history changing, but that will require `dialog` changes
	hawkejs.scene.openUrl(url, {history: false}, function rendered(err, payload) {

		if (err) {
			console.error(err);
			return callback(err);
		}

		// Reset the active/inactive classes
		that.resetActive();
	});
});

/**
 * Send an action to the server
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {URL|String}   url
 */
DisplayClass.setMethod(function doEvent(args) {
	this.emit.apply(this, args);
});

/**
 * Request a video player
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Boolean}   create_new   Create a new player? [false]
 *
 * @return  {VideoPlayer}
 */
DisplayClass.setMethod(function getVideoplayer(create_new) {
	return this.video_player;
});

/**
 * Create a link to the server
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {String}   action_name   The name of the action to link to
 *
 * @return  {ClientLinkup}
 */
DisplayClass.setMethod(function createLink(action_name, data, callback) {

	if (typeof data == 'function') {
		callback = data;
		data = null;
	}

	return alchemy.linkup('display@displaylink', {action: action_name, data: data}, callback);
});