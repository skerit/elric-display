/**
 * The Chimera Static Controller class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Display = Function.inherits('Controller', function DisplayController(conduit) {
	DisplayController.super.call(this, conduit);
});

/**
 * The 'start' action is the main screen of a display
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Conduit}   conduit
 */
Display.setMethod(function start(conduit) {
	this.render('display/start');
});