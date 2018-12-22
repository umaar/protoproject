$(() => {
	window.startAudio = function () {
		console.log('startAudio');
		playAudio();
	};

	const visualisation = {
		init() {
			const visualisation = $('<canvas>').appendTo('.media');
			visualisation.addClass('visualisation');

			// Canvas = document.createElement('canvas');
			// 1024 is the number of samples that's available in the frequency data
			visualisation[0].width = 1024;
			// 255 is the maximum magnitude of a value in the frequency data
			visualisation[0].height = 255;

			const canvasContext = visualisation[0].getContext('2d');
			canvasContext.fillStyle = '#000';

			this.canvasContext = canvasContext;
			this.canvas = visualisation[0];
			this.draw();
		},

		draw() {
			const canvasContext = this.canvasContext;
			const canvas = this.canvas;
			// Setup the next frame of the drawing
		 	 requestAnimationFrame(this.draw.bind(this));

		  // Create a new array that we can copy the frequency data into
			const freqByteData = new Uint8Array(analyser.frequencyBinCount);
			// Copy the frequency data into our new array
			analyser.getByteFrequencyData(freqByteData);

			// Clear the drawing display
			canvasContext.clearRect(0, 0, canvas.width, canvas.height);

			// For each "bucket" in the frequency data, draw a line corresponding to its magnitude
			for (let i = 0; i < freqByteData.length; i++) {
				canvasContext.fillRect(i, canvas.height - freqByteData[i], 1, canvas.height);
			}
		}
	}; // Visualisation

	radio('Audio:start').subscribe(() => {
		visualisation.init();
	});

	/*
	*	Listen for messages us telling us the user has just updated the controls
	*/
	radio('Controls:filter').subscribe(msg => {
		const filter = msg.filter;
		const value = msg.value;
		if (filter == 'filter-1') {
			changePlaybackRate(value);
		} else if (filter == 'filter-2') {
			setRingModulatorDistortion(value);
		} else if (filter == 'filter-3') {
			setLowPassFrequency(value);
		}
		/*
		If (filter === 'filter-3') {
			filters.filter3({
				context: context,
				value: value
			});
		}
		*/
	});

	info({helloFromAudio: true});

	const context = audioContext = new AudioContext();

	let source;

	let output;

	const assets = new AbbeyLoad([{
		audioInput: 'sound.wav'
	}], (buffers => {
   		audioInput = createSourceWithBuffer(buffers.audioInput);

   		// Broadcast current playback rate
   		radio('Audio:filter').broadcast({
			filter: 'filter-1',
			value: audioInput.playbackRate.value
		});

		radio('Audio:filter').broadcast({
			filter: 'filter-2',
			value: 0
		});

		radio('Audio:filter').broadcast({
			filter: 'filter-3',
			value: 2
		});

	    outputMix = audioContext.createGain();

		// Create the filter
		lowPassFilter = context.createBiquadFilter();
		// Create the audio graph.
		lowPassFilter.connect(outputMix);
		// Create and specify parameters for the low-pass filter.
		lowPassFilter.type = 0; // Low-pass filter. See BiquadFilterNode docs
		lowPassFilter.frequency.value = 400; // Set cutoff to 440 HZ
		setLowPassFrequency(1);

		audioInput.connect(lowPassFilter);

		lowPassFilter.connect(outputMix);

		// AudioInput.connect(outputMix);
	    outputMix.connect(audioContext.destination);

	    window.s = audioInput;

	    // CurrentEffectNode = createReverb();
	    // currentEffectNode.connect(audioInput);

	    createRingModulator();

	    // CreateDelay();
	}));

	function playAudio() {
		audioInput.start(0);
	}

	function pauseAudio() {
		audioInput.stop(0);
	}

	window.playAudio = playAudio;
	window.pauseAudio = pauseAudio;

	/*
	Helpers
*/

	// shortcut broadcast to info channel
	function info(msg) {
		radio('info').broadcast(msg);
	}

	function createSourceWithBuffer(buffer) {
		const source = context.createBufferSource();

		analyser = context.createAnalyser();
		source.connect(analyser);
		analyser.connect(context.destination);

		console.log('buffer', buffer);

		// Create a gain node.
		source.buffer = buffer;
		// Turn on looping.
		source.loop = true;

		// Connect gain to destination.
		// gainNode.connect(context.destination);

		return source;
	}

	/*
	Effects
*/

	function setLowPassFrequency(value) {
		const minValue = 40;
		const maxValue = context.sampleRate / 2;
		const numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
		const multiplier = 2 ** numberOfOctaves * (value - 1.0);
		lowPassFilter.frequency.value = maxValue * multiplier;
	}

	function changePlaybackRate(val) {
		audioInput.playbackRate.value = val;
	}

	let vInDiode1; let vInDiode2; let vcDiode3; let vcDiode4;

	function createRingModulator() {
		DiodeNode = (function () {
	    function DiodeNode(context) {
	      this.context = context;
	      this.node = this.context.createWaveShaper();
	      this.vb = 0.2;
	      this.vl = 0.4;
	      this.h = 1;
	      this.setCurve();
	    }

	    DiodeNode.prototype.setDistortion = function (distortion) {
	      this.h = distortion;
	      return this.setCurve();
	    };

	    DiodeNode.prototype.setCurve = function () {
	      let i; let samples; let v; let value; let wsCurve; let _i; let _ref;
	      samples = 1024;
	      wsCurve = new Float32Array(samples);
	      for (i = _i = 0, _ref = wsCurve.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
	        v = (i - samples / 2) / (samples / 2);
	        v = Math.abs(v);
	        if (v <= this.vb) {
	          value = 0;
	        } else if ((this.vb < v) && (v <= this.vl)) {
	          value = this.h * ((v - this.vb ** 2) / (2 * this.vl - 2 * this.vb));
	        } else {
	          value = this.h * v - this.h * this.vl + (this.h * ((this.vl - this.vb ** 2) / (2 * this.vl - 2 * this.vb)));
	        }
	        wsCurve[i] = value;
	      }
	      return this.node.curve = wsCurve;
	    };

	    DiodeNode.prototype.connect = function (destination) {
	      return this.node.connect(destination);
	    };

	    return DiodeNode;
	  })();

	  vIn = context.createOscillator();
	  vIn.frequency.value = 30;
	  vIn.start(0);
	  vInGain = context.createGain();
	  vInGain.gain.value = 0.5;
	  vInInverter1 = context.createGain();
	  vInInverter1.gain.value = -1;
	  vInInverter2 = context.createGain();
	  vInInverter2.gain.value = -1;
	  vInDiode1 = new DiodeNode(context);
	  vInDiode2 = new DiodeNode(context);
	  vInInverter3 = context.createGain();
	  vInInverter3.gain.value = -1;
	  // Player = new SamplePlayer(context);
	  vcInverter1 = context.createGain();
	  vcInverter1.gain.value = -1;
	  vcDiode3 = new DiodeNode(context);
	  vcDiode4 = new DiodeNode(context);
	  outGain = context.createGain();
	  outGain.gain.value = 4;
	  compressor = context.createDynamicsCompressor();
	  compressor.threshold.value = -12;
	  // Player.connect(vcInverter1);
	  // player.connect(vcDiode4);
	  audioInput.connect(vcInverter1);
	  audioInput.connect(vcDiode4.node);
	  vcInverter1.connect(vcDiode3.node);
	  vIn.connect(vInGain);
	  vInGain.connect(vInInverter1);
	  vInGain.connect(vcInverter1);
	  vInGain.connect(vcDiode4.node);
	  vInInverter1.connect(vInInverter2);
	  vInInverter1.connect(vInDiode2.node);
	  vInInverter2.connect(vInDiode1.node);
	  vInDiode1.connect(vInInverter3);
	  vInDiode2.connect(vInInverter3);
	  vInInverter3.connect(compressor);
	  vcDiode3.connect(compressor);
	  vcDiode4.connect(compressor);
	  compressor.connect(outGain);
	  outGain.connect(outputMix);

	  setRingModulatorDistortion(0);
	}

	function setRingModulatorDistortion(val) {
		console.log('Distortion ', val / 25);
		[vInDiode1, vInDiode2, vcDiode3, vcDiode4].forEach(diode => {
			return diode.setDistortion(val / 25);
		});
	}
});
