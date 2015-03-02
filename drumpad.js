window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new window.AudioContext();
var frequencies = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13];


//calcualte the frequency of a note based on a=440hz; pitch is halfsteps away from a4
function calculateFrequency(pitch, start){
	var noteFrequency = start*Math.pow(Math.pow(2,1/12),pitch);
  	return noteFrequency;
}


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
	
	var osc1;
	var gainNode;
	
	object.playPiano = function (){
		if($('#onoff1').prop("checked") == true) {
			osc1 = context.createOscillator();
		  	gainNode = context.createGain();
		  	osc1.type = $('#waveform option:selected').text();
			gainNode.connect(context.destination);
			gainNode.gain.setValueAtTime(0,context.currentTime);
			gainNode.gain.linearRampToValueAtTime( document.querySelector('#osc1gain').value, context.currentTime+0.01);
			osc1.connect(gainNode);
			osc1.frequency.value = object.frequency;
			osc1.start(0);
		}
	}	

	object.stopPiano = function () {
		if (osc1) {
			gainNode.gain.setValueAtTime(gainNode.gain.value, context.currentTime);
			gainNode.gain.linearRampToValueAtTime( 0, context.currentTime+0.01);
		};
	}		
}

$(function(){
	//add audio properties to drum pad
	$('#sp div').each(function() {
		addAudioProperties(this);
	});

	$('#sp div').click(function() {
		this.play();
	});

	//add oscillators to the keyboard
	var current = 0;
	
	//array with charcodes for the computer keys in order of piano
	var keyboardStrokes = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p'];
	var keyToCharCode = [];

	for (var i = 0; i < keyboardStrokes.length; i++) {
		keyToCharCode.push(keyboardStrokes[i].charCodeAt(0)-32);
	}
	
	$('.key').each(function() {
		this.frequency = calculateFrequency(current, 130.81);
		$(this).data("frequency", current);
		addSynthProperties(this);
		$(this).attr('id', 'keynumber'+keyToCharCode[current]);
		current++;
	});


	//keyboard control
	var keysThatAreDown = {}; //object that holds keys that are pressed to avoid repetitive keypress
	$(document).on( "keydown", function( event ) {
		if($.inArray(event.which, keyToCharCode) > -1) { 
		  if (!keysThatAreDown[event.which]) {
		  	if ( $("#keynumber"+event.which).is('span') ) 	
				$("#keynumber"+event.which).addClass('pressedblack');
			else
				$("#keynumber"+event.which).addClass('pressedwhite');
		  	$("#keynumber"+event.which)[0].playPiano();
		  	keysThatAreDown[event.which] = true;
		  }
		}
	});
	
	$(document).on( "keyup", function( event ) {
		if($.inArray(event.which, keyToCharCode) > -1) {  
		  $("#keynumber"+event.which).removeClass('pressedwhite pressedblack');
		  $("#keynumber"+event.which)[0].stopPiano(0);
		  keysThatAreDown[event.which] = false;
		  $("#keynumber"+event.which)[0].stopPiano(0);
		}
		
	});

	//track if mouse is down
	var mouseDown = 0;
	document.body.onmousedown = function() { 
		mouseDown++;
	}
	
	document.body.onmouseup = function() {
		mouseDown--;
	}

	//stop and play the synth with mouse
	$('.key').on('mousedown', function(){
			if ( $(this).is('span') ) 	
				$(this).addClass('pressedblack');
			else
				$(this).addClass('pressedwhite');
			this.playPiano();
	});

	$('.key').on('mouseover', function(){
		if (mouseDown == 1) {
			if ( $(this).is('span') ) 	
				$(this).addClass('pressedblack');
			else
				$(this).addClass('pressedwhite');
			this.playPiano();
		}
	});


	$('.key').on('mouseup mouseout', function(){
		$(this).removeClass('pressedwhite pressedblack')
		this.stopPiano();
	});

	// touch events
	$('.key').on('touchstart touchenter', function(event){
		event.preventDefault();
			if ( $(this).is('span') ) 	
				$(this).addClass('pressedblack');
			else
				$(this).addClass('pressedwhite');
			this.playPiano();
	});

	$('.key').on('touchend touchleave', function(){
		$(this).removeClass('pressedwhite pressedblack')
		this.stopPiano();
	});
});

