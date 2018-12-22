$(() => {
	// Document ready

	radio('Audio:filter').subscribe(msg => {
		const filter = msg.filter;
		const value = parseFloat(parseFloat(msg.value).toFixed(2));
		$('#' + filter).find('input').val(value);
		$('#' + filter).find('.value').text(value);
	});

	$('.slider input').on('change', function (val) {
		console.log('Changed ', val);
		$(this).parent('.slider').find('.value').text($(this).val());

		// When we change the slider manually, publish an event
		const filterName = $(this).parent('.slider').attr('id');
		radio('Controls:filter').broadcast({
			filter: filterName,
			value: $(this).val()
		});
	});
});
