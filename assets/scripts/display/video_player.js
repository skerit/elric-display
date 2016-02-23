/**
 * The client-side VideoPlayer class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var VideoPlayer = Function.inherits('Informer', 'Elric', function VideoPlayer(is_main) {

	// Is this the main player?
	this.is_main = is_main;

	// Create unique id
	this.id = Crypto.pseudoHex();

	// Init the elements
	this.init();

	// Fullscreen is false at beginning
	this.is_fullscreen = false;

	// The default duration
	this.default_duration = 2400;

	// Length of segment pieces to fetch in seconds
	this.segment_length = 2 * 60;

	// The value last seeked to
	this.last_seek = null;
});

/**
 * Initialize the elements
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function init() {

	var that = this,
	    manual_seek = false,
	    controls = {},
	    lastdec = 0;

	// Create video element
	this.video = Blast.parseHTML('<video class="video"></video>');

	// Create audio element
	this.audio = Blast.parseHTML('<audio class="audio"></audio>');

	this.wrap = Blast.parseHTML('<div id="videoplayer-' + this.id + '"class="video-player"></div>');
	this.controls = Blast.parseHTML('<div class="controls"></div>');
	this.cover = Blast.parseHTML('<div class="cover"></div>');
	this.loader = Blast.parseHTML('<div class="loader-wrapper"><div class="loader"></div></div>');

	controls.play = Blast.parseHTML('<button type="button" class="play">Play</button>');
	controls.seek = Blast.parseHTML('<input type="range" class="seek" value="0" max="1000" step="0.01">');
	controls.mute = Blast.parseHTML('<button type="button" class="mute">Mute</button>');
	controls.volume = Blast.parseHTML('<input type="range" class="volume" min="0" max="1" step="0.1" value="1">');
	controls.fullscreen = Blast.parseHTML('<button type="button" class="fullscreen">Fullscreen</button>');

	controls.play.addEventListener('click', function() {
		if (that.video.paused == true) {
			that.video.play();
		} else {
			that.video.pause();
		}
	});

	this.video.addEventListener('playing', function() {
		controls.play.innerHTML = '<i class="fa fa-pause"></i>';
	});

	this.video.addEventListener('pause', function() {
		controls.play.innerHTML = '<i class="fa fa-play"></i>';
	});

	// Event listener for the seek bar
	controls.seek.addEventListener('change', function onChange() {

		var value;

		console.log('Seek bar changed');

		// Calculate the new time
		value = that.duration * (this.valueAsNumber / 1000);

		// Seek to the requested time
		that.seek(value);
	});

	// Pause during seeking!
	controls.seek.addEventListener('mousedown', function onMousedown() {
		manual_seek = true;
		that.video.pause();
	});

	// Listen to seek events
	controls.seek.addEventListener('click', function onClick() {
		console.log('Seek bar click, resume play?');
	});

	controls.seek.addEventListener('mouseup', function onMouseup() {
		manual_seek = false;
	});

	controls.volume.addEventListener('change', function() {
		that.video.volume = controls.volume.value;
	});

	// Event listener for the mute button
	controls.mute.addEventListener('click', function() {

		if (that.video.muted == false) {
			that.video.muted = true;
			controls.mute.innerHTML = '<i class="fa fa-volume-off">';
		} else {
			that.video.muted = false;
			controls.mute.innerHTML = '<i class="fa fa-volume-up">';
		}
	});

	// Going fullscreen
	controls.fullscreen.addEventListener('click', function() {
		that.toggleFullScreen();
	});

	// Update the seek bar as the video plays
	this.video.addEventListener('timeupdate', function() {

		var value,
		    curdec,
		    duration;

		//console.log('Got timeupdate')

		if (manual_seek) {
			return;
		}

		duration = that.duration;

		if (!duration) {
			duration = 2400;
		}

		// Calculate the slider value
		value = (1000 / duration) * that.video.currentTime;

		// Update the slider value
		controls.seek.value = value;

		// Get the current time, rounded to 10 seconds
		curdec = ~~(that.video.currentTime / 10);

		// Emit a timeupdate
		that.emit('timeupdate', that.video.currentTime);

		// See if we need more data
		that.checkBuffer(that.video.currentTime);

		if (curdec > lastdec) {

			// Tell the server how much we've seen
			//that.viewlink.submit('timeupdate', that.video.currentTime);

			// Update the last second
			lastdec = curdec;
		}
	});

	this.wrap.appendChild(this.video);
	this.wrap.appendChild(this.audio);
	this.wrap.appendChild(this.controls);
	this.wrap.appendChild(this.cover);
	this.wrap.appendChild(this.loader);

	this.controlElements = controls;

	Object.each(controls, function eachControl(control) {
		that.controls.appendChild(control);
	});
});

/**
 * Get the duration
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @return        {Number}
 */
VideoPlayer.setProperty(function duration() {

	var result;

	if (this.currentSource && this.currentSource.duration != null) {
		return this.currentSource.duration;
	}

	if (isFinite(this.video.duration)) {
		return this.video.duration;
	}

	if (this.default_duration) {
		return this.default_duration;
	}

	return 0;
});

/**
 * Get the current time
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @return        {Number}
 */
VideoPlayer.setProperty(function currentTime() {
	return this.video.currentTime;
});

/**
 * Check the buffer and see if we need to make a new request
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function checkBuffer(currentTime) {

	if (this.currentSource) {
		return this.currentSource.checkBuffer(currentTime);
	}

	return false;
});

/**
 * Does the current source have the requested time available
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function hasTime(value) {

	if (this.currentSource) {
		return this.currentSource.hasTime(value);
	}

	return false;
});

/**
 * Indicate the given range is being downloaded
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function registerRange(start, end) {

	if (this.currentSource) {
		return this.currentSource.registerRange(start, end);
	}

	return false;
});

/**
 * See if we need to fetch any range
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function calculateRangeToFetch(start, end) {

	if (this.currentSource) {
		return this.currentSource.calculateRangeToFetch(start, end);
	}

	return false;
});

/**
 * Start playing the video
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function play() {
	this.video.play();
});

/**
 * Pause the video
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function pause() {
	this.video.pause();
});

/**
 * Seek to the requested time
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function seek(value) {

	var that = this,
	    min = ~~(value / 10) * 10,
	    max = min + this.segment_length;

	// Store the value we last seeked to
	this.last_seek = value;

	this.currentSource.requestRange(min, max, false, function gotRange() {

		// If another seek happened in the mean time, ignore this range response
		if (that.last_seek != value) {
			return;
		}

		// If the requested start time isn't available yet, wait another second
		if (!that.hasTime(value)) {
			return setTimeout(gotRange, 1000);
		}

		// Update the video time
		that.video.currentTime = value;

		// Resume the video
		that.play();
	});
});

/**
 * Toggle fullscreen
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function toggleFullScreen() {
	this.setFullScreen(!this.is_fullscreen);

	return this.is_fullscreen;
});

/**
 * Set the fullscreen
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function setFullScreen(value) {

	var element = this.wrap;

	if (value == null) {
		value = true;
	}

	if (value) {
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen(); // Firefox
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen(); // Chrome and Safari
		}

		this.is_fullscreen = true;
	} else {
		if (document.cancelFullscreen) {
			document.cancelFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen(); // Firefox
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen(); // Chrome and Safari
		}

		this.is_fullscreen = false;
	}

	return this.is_fullscreen;
});

/**
 * Move the video player to the given element
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function moveTo(element) {

	if (typeof element == 'string') {
		element = document.querySelector(element);
	}

	this.element = element;

	// Clear the video central content
	this.element.innerHTML = '';

	// Make sure it's visible
	this.element.style.display = '';

	// Add this video
	this.element.appendChild(this.wrap);
});

/**
 * Play a stream
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function playStream(stream, data) {

	var that = this,
	    source;

	if (!data) {
		data = {};
	}

	// Unset the play id
	this.setPlayId(null);

	source = new PlaySource(this, stream, data);

	this.currentSource = source;
	this.optionId = data.option_id;

	// Start playing the video
	this.video.play();

	// Make sure to start at the correct timestamp
	source.on('start_time', function gotStartTime(timestamp) {
		console.log('Start time')
		if (timestamp > 0) {
			that.video.currentTime = timestamp;
		}
	});

	// Make sure the cover is hidden
	this.cover.hidden = true;
	this.loader.hidden = true;

	return source;
});

/**
 * Set the identifier of the video that is playing
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
VideoPlayer.setMethod(function setPlayId(id) {
	this.play_id = id;
});