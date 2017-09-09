$(function() {
    // Handler for .ready() called.
    // Listen for things on the "info" channel
    radio("info").subscribe(function (msg) { console.info('info', msg); });


    var audioDisabled = function() {
        $(".ui-components").addClass("disabled");
        $(".slider input").attr({disabled: 'disabled'})
    };

    var audioEnabled = function() {
        $(".ui-components").removeClass("disabled");
        $(".slider input").attr({disabled: false});
    };

    /* Playing of audio if initiated by the user, therefore we should disable audio controls at the start */
    audioDisabled();

    $("#start").click(function () {
        $(this).fadeOut();
        startVideo();
        startAudio();
        audioEnabled();
        radio("Audio:start").broadcast();
    });
});
