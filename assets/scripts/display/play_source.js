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

	console.log('Data:', data);

	if (!data.codec) {
		data.codec = 'video/webm; codecs="vorbis,vp8"';
	}

	this.player = player;
	this.stream = stream;
	this.received = 0;
	this.videoBufferBusy = true;

	// The timestamp start
	this.start_time = null;

	// Count buffer updates
	this.buffer_updates = 0;

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

	this.stream.on('data', function onData(data) {
		that.addToBuffer(new Uint8Array(data));
	});
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
	}

	if (!this.videoBufferBusy && this.cache.length) {

		this.videoBufferBusy = true;

		// Get the next block to add
		block = this.cache.shift();

		// Append it
		this.videoBuffer.appendBuffer(block);
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