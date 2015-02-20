var context = new AudioContext();

function loadAudio(object, url) {
	var request =new XMLHttpRequest;
	request.open('GET',url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		context.decodeAudioData(request.response, function(buffer) {
			object.buffer = buffer;
		});
	}
	request.send();
}

function addAudioProperties(object) {
	object.name = object.id;
	object.source = $(object).data('sound');
	object.volume = context.createGain()
	loadAudio(object, object.source);
	object.play =function () {
		var s = context.createBufferSource();
		s.buffer = object.buffer;
		s.connect(object.volume);
		object.volume.connect(context.destination);
		s.start(0);
	}

}

function addSynthProperties(object){
	object.name =object.id;
	oscillator = context.createOscillator();
  	gainNode = context.createGain();
  	oscillator.type = 'triangle';
	gainNode.connect(context.destination);
	oscillator.connect(gainNode);
	oscillator.frequency.value = 261.6;
	object.playPiano = function (){
		oscillator.start();
	}
	object.stopPiano = function () {
		oscillator.stop();
	}
}

$(function(){
	$('#sp div').each(function() {
		addAudioProperties(this);
	});

	$('#sp div').click(function() {
		this.play();
	});
	$('.key').each(function() {
		addSynthProperties(this);
	});

	$('.key').mousedown(function(){
		this.playPiano();
	});
	$('.key').mouseup(function(){
		this.stopPiano();
	});

});