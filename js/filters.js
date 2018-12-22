(function (global) {
	const filters = {
		filter3(obj) {
			console.log('Filter 3 called', obj.value, obj.context);
		}
	};

	global.filters = filters;
})(window);
