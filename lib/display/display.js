/**
 * The Display class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Display = Function.inherits('Elric.Wrapper', function Display() {});

/**
 * This is a wrapper class
 *
 * @type {Boolean}
 */
Display.setProperty('extend_only', true);

/**
 * This wrapper class starts a new group
 *
 * @type {Boolean}
 */
Display.setProperty('starts_new_group', true);

/**
 * Description of the action
 *
 * @type {String}
 */
Display.setProperty('description', '');

/**
 * Attach a controller & conduit
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Controller}   controller
 */
Display.setMethod(function addController(controller) {
	this.controller = controller;
	this.conduit = controller.conduit;
});