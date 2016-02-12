// Create a new "display" section
var display = Router.section('display', '/display');

/**
 * Set display data
 */
display.use(function setDisplayData(req, res, next) {

	var actions = {},
	    action_class,
	    key;

	// Always disable default tabindex
	req.conduit.internal('tabindex', false);

	for (key in alchemy.classes.Elric.Display.group) {
		action_class = alchemy.classes.Elric.Display.group[key];

		actions[key] = {
			name: action_class.prototype.type_name,
			title: action_class.prototype.title,
			description: action_class.prototype.description
		};
	}

	req.conduit.set('actions', actions);

	next();
});

display.get('Start', '/', 'Display#start');
display.get('Action', '/:action', 'Display#action');

display.linkup('Display::linkup', 'displaylink', 'Display#createLink');