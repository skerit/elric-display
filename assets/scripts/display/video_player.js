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

	controls.play = Blast.parseHTML('<button type="button" class="play"><i class="fa fa-play"></i></button>');
	controls.seek = Blast.parseHTML('<input type="range" class="seek" value="0" max="1000" step="0.01">');
	controls.mute = Blast.parseHTML('<button type="button" class="mute"><i class="fa fa-volume-up"></i></button>');
	controls.volume = Blast.parseHTML('<input type="range" class="volume" min="0" max="1" step="0.1" value="1">');
	controls.fullscreen = Blast.parseHTML('<button type="button" class="fullscreen"><i class="fa fa-expand"></i></button>');

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
	controls.seek.addEventListener('change', function() {

		var value,
		    duration;

		if (isFinite(that.video.duration)) {
			duration = that.video.duration;
		} else {
			duration = 2400;
		}

		// Calculate the new time
		value = duration * (controls.seek.value / 100);

		// Update the video time
		that.video.currentTime = value;
	});

	// Pause during seeking!
	controls.seek.addEventListener('mousedown', function() {
		that.video.pause();
	});

	controls.seek.addEventListener('mouseup', function() {
		that.video.play();
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

		var video = that.video;

		if (video.requestFullscreen) {
			video.requestFullscreen();
		} else if (video.mozRequestFullScreen) {
			video.mozRequestFullScreen(); // Firefox
		} else if (video.webkitRequestFullscreen) {
			video.webkitRequestFullscreen(); // Chrome and Safari
		}
	});

	// Update the seek bar as the video plays
	this.video.addEventListener('timeupdate', function() {

		var value,
		    curdec,
		    duration;

		if (isFinite(that.video.duration)) {
			duration = that.video.duration;
		} else {
			duration = 2400;
		}

		// Calculate the slider value
		value = (1000 / duration) * that.video.currentTime;

		// Update the slider value
		controls.seek.value = value;

		// Get the current time, rounded to 10 seconds
		curdec = ~~(that.video.currentTime / 10)

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
});