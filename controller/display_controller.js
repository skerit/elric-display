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

/**
 * The 'action' method
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Conduit}   conduit
 */
Display.setMethod(function action(conduit, action_name) {

	var ActionClass = alchemy.classes.Elric.Display.getMember(action_name),
	    action = new ActionClass();

	action.addController(this);

	conduit.set('action_name', action_name);

	action.display(conduit);
});

/**
 * Receive linkups
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param   {Conduit}   conduit
 */
Display.setMethod(function createLink(conduit, linkup, data) {

	var ActionClass,
	    action_name = data.action,
	    action;

	if (!action_name) {
		return console.error('No action name given');
	}

	ActionClass = alchemy.classes.Elric.Display.getMember(action_name);

	if (!ActionClass) {
		return console.error('Could not find action class', action_name);
	}

	action = new ActionClass();

	action.addController(this);

	conduit.set('action_name', action_name);

	// Call the createLink method
	if (action.createLink) {
		action.createLink(conduit, linkup, data.data);
	} else {
		console.error('Action', action_name, 'does not have a createLink method');
	}
});