/**
 * The PlaySource
 *
 * @constructor
 * @extends       alchemy.classes.Informer
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
var PlaySource = Function.inherits('Informer', 'Elric', function PlaySource(player, stream, data) {

	var that = this;

	if (!data) {
		data = {};
	}

	console.log('PlaySource Data:', data);

	if (!data.codec) {
		data.codec = 'video/webm; codecs="vorbis,vp8"';
	}

	this.player = player;
	this.streams = [];
	this.videoBufferBusy = true;

	// The duration of this source
	this.duration = null;

	// Count the amount of data received
	this.received = 0;

	// Count the amount of data in the buffer
	this.buffered = 0;

	// The timestamp start
	this.start_time = null;

	// Count buffer updates
	this.buffer_updates = 0;

	// Requested ranges
	this.requested_ranges = [];

	// Cache response received from websocket before it's written to buffer
	this.cache = [];

	// The MediaSource instances
	this.videoSource = new MediaSource();
	this.audioSource = new MediaSource();

	// Listen for the videosource to open
	this.videoSource.addEventListener('sourceopen', function videoSourceOpen() {

		// Create the buffer
		that.videoBuffer = that.videoSource.addSourceBuffer(data.codec);
		that.videoBufferBusy = false;

		that.videoBuffer.addEventListener('updatestart', function onupdate() {
			that.videoBufferBusy = true;
		});

		that.videoBuffer.addEventListener('updateend', function onend(e) {
			that.videoBufferBusy = false;
			that.buffer_updates++;
		});

		that.videoSourceOpen = true;
		that.emit('videoSourceOpen');
	}, false);

	// Listen for the audiosource to topen
	this.audioSource.addEventListener('sourceopen', function audioSourceOpen() {
		that.audioSourceOpen = true;
		that.emit('audioSourceOpen');
	});

	// Set the sources
	this.videoSource.url = window.URL.createObjectURL(this.videoSource);
	this.audioSource.url = window.URL.createObjectURL(this.audioSource);

	player.video.src = this.videoSource.url;
	player.audio.src = this.audioSource.url;

	if (data.range) {
		this.registerRange(data.range);
	}

	this.addStream(stream);
});

/**
 * Set the duration of this source
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function setDuration(duration) {
	this.duration = duration;
});

/**
 * Add a stream
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function addStream(stream, range) {

	var that = this,
	    streamId = this.streams.push(stream) - 1;

	// Pause the stream
	stream.pause();

	if (!range) {
		range = [0];
	}

	console.log('Adding stream', stream);

	if (streamId > 0) {
		// Wait for the previous stream to end
		this.after('stream-end-' + (streamId - 1), function streamDone() {
			doStream();
		});

		return;
	} else {
		doStream();
	}

	function doStream() {
		that.after('videoSourceOpen', function opened() {

			// Set the offset
			that.videoBuffer.timestampOffset = range[0];

			stream.resume();

			stream.on('data', function onData(data) {
				that.addToBuffer(new Uint8Array(data));
			});

			stream.on('end', function ended() {
				console.log('Stream has ended');
				that.emit('stream-end-' + streamId);
			});
		});
	}
});

/**
 * Check the buffer and see if we need to make a new request
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function checkBuffer(currentTime) {

	var range,
	    diff;

	range = this.calculateRangeToFetch(currentTime, currentTime + 30);

	if (!range) {
		return;
	}

	diff = range[1] - range[0];

	// If the range is smaller than 10 seconds, don't get it just yet
	if (diff < 10) {
		return false;
	}

	this.registerRange(range);
	this.emit('request_range', range);
});

/**
 * See if the requested time has been requested
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function hasRequestedTime(value) {

	var requested = this.requested_ranges,
	    ranges = requested.length,
	    range,
	    i;

	for (i = 0; i < ranges; i++) {
		if (value >= requested[i][0] && value <= requested[i][1]) {
			return true;
		}
	}

	return false;
});

/**
 * See if the requested time is available in the buffer
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function hasTime(value) {

	var buffered = this.videoBuffer.buffered,
	    ranges = buffered.length,
	    range,
	    i;

	for (i = 0; i < ranges; i++) {
		if (value >= buffered.start(i) && value <= buffered.end(i)) {
			return true;
		}
	}

	return false;
});

/**
 * Return the last non-available time
 * before or equal to the given time
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function nonAvailableTime(direction, value) {

	var buffered = this.videoBuffer.buffered,
	    ranges = buffered.length,
	    result,
	    range,
	    i;

	// If the time isn't available, just return it
	if (!this.hasTime(value)) {
		return value;
	}

	// If it is available, return the earliest available time
	for (i = 0; i < ranges; i++) {
		if (value >= buffered.start(i) && value <= buffered.end(i)) {
			if (direction == 'before') {
				return buffered.start(i);
			} else {
				return buffered.end(i);
			}
		}
	}
});

/**
 * Return the last non-available and non-requested time,
 * before or equal to the given time
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function nonRequestedTime(direction, value) {

	var requested = this.requested_ranges,
	    ranges = requested.length,
	    result,
	    range,
	    i;

	if (direction == 'before') {

		// Sort the array by the second (end) value, ascending
		requested.sortByPath(1, '1');

		result = 0;

		for (i = 0; i < ranges; i++) {
			range = requested[i];

			// If the end is smaller, use that
			if (range[1] < value && range[1] > result) {
				result = range[1];
			}
		}

		if (this.hasRequestedTime(result)) {
			return this.nonRequestedTime('after', result);
		}

		return result;
	}

	// If the time isn't available, just return it
	if (!this.hasRequestedTime(value)) {
		return value;
	}

	result = value;


	// If it is available, return the earliest available time
	for (i = 0; i < ranges; i++) {
		range = requested[i];

		// See if the requested value falls within the range
		if (result >= range[0] && result <= range[1]) {
			if (range[1] > result) {
				result = range[1];
			}
		}
	}

	return result;
});

/**
 * See if we need to fetch any range
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function calculateRangeToFetch(start, end) {

	var result;

	if (Array.isArray(start)) {
		end = start[1];
		start = start[0];
	}

	// Get up to 60 seconds
	if (!end) {
		end = start + 60;
	}

	result = [~~this.nonRequestedTime('after', start), ~~this.nonRequestedTime('after', end)];

	//console.log('Wanted', [start, end], 'fetching', result);

	return result;
});

/**
 * Indicate the given range is being downloaded
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function registerRange(start, end) {

	var range;

	if (!Array.isArray(start)) {
		range = [start, end];
	} else {
		range = start;
	}

	this.requested_ranges.push(range);

	return true;
});


/**
 * Add a block to the buffer when it's ready
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.1.0
 * @version       0.1.0
 */
PlaySource.setMethod(function addToBuffer(block) {

	var that = this;

	if (block) {
		this.cache.push(block);
		this.received += block.length;
		this.buffered += block.length;
	}

	if (!this.videoBufferBusy && this.cache.length) {

		this.videoBufferBusy = true;

		// Get the next block to add
		block = this.cache.shift();

		// Append it
		this.videoBuffer.appendBuffer(block);

		//console.log('Buffer size is now', this.buffered);
	}

	if (this.start_time == null && this.buffer_updates > 0 && this.videoBuffer.buffered.length) {
		this.start_time = this.videoBuffer.buffered.start(0);

		// Emit the start_time of this stream
		this.emit('start_time', this.start_time);
	}

	// Schedule the next run
	if (this.cache.length) {
		requestAnimationFrame(function() {
			that.addToBuffer();
		});
	}

});