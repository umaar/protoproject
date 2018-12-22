$(() => {
	// Handler for .ready() called.
	// Listen for things on the "info" channel
	radio('info').subscribe(msg => {
		console.info('info', msg);
	});

	const audioDisabled = function () {
		$('.ui-components').addClass('disabled');
		$('.slider input').attr({disabled: 'disabled'});
	};

	const audioEnabled = function () {
		$('.ui-components').removeClass('disabled');
		$('.slider input').attr({disabled: false});
	};

	/* Playing of audio if initiated by the user, therefore we should disable audio controls at the start */
	audioDisabled();

	$('#start').click(function () {
		$(this).fadeOut();
		startVideo();
		startAudio();
		audioEnabled();
		radio('Audio:start').broadcast();
	});
});
