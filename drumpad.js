window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new window.AudioContext();
var frequencies = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13];

//calculate the frequency of a note based on start (hz); pitch is halfsteps away from a4
function calculateFrequency(pitch, start){
	var noteFrequency = start*Math.pow(Math.pow(2,1/12),pitch);
	return noteFrequency;
}

//create buffer for drum pad
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


//add properties to the drumpad
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

//variables for local storage
	var seshInProgress = true;

//add synth to the keyboard
function addSynthProperties(object){
	//object to hold active oscillators and gain
	var note = {};
	
	//method to playpiano - includes check to see if each osc is turned on (has a checked box)
	object.playPiano = function (){ 
		$('.osc').each( function(){
			var el = $(this);
			var onoff = el.find('.onoff');
			var waveform = el.find('.waveform option:selected');
			var gain = el.find('.gain');
			var gainAttack = el.find('.volattack');
			var gainSustain = el.find('.volsustain');
			var gainDecay = el.find('.voldecay')
			var gainRelease = el.find('.volrelease')
			var masterVolume = $('#mastercontrol .volgain');
			var masterVolAttack = $('#mastercontrol .volattack');
			var masterVolDecay = $ ('#mastercontrol .voldecay')
			var masterVolSustain = $('#mastercontrol .volsustain');
			var masterVolRelease = $('#mastercontrol .volrelease'); 
			
			//attack decay sustain function 
			function ads( attribute, level, attack, decay, sustain) {
				  	//set envelope to zero to add attack
					attribute.setValueAtTime(0,context.currentTime);
					//attack envelope - 1st arg is target volume for top of attack (from oscillator), 2nd arg is time 
					attribute.linearRampToValueAtTime( parseFloat(level), context.currentTime + parseFloat(attack));
					//decay	
					attribute.linearRampToValueAtTime( parseFloat(sustain), context.currentTime + parseFloat(decay));	
			  	}

			if(onoff.prop('checked') == true) {
				// commenting this out cause i'm not sure if it's used this.counter = 0;
				var osc1 = context.createOscillator();
			  	//this channel's gain node
			  	var gainNode1 = context.createGain();
			  	//pseudo master gain node: this gain node will be the same in all oscillators, mimicking a master channel, but allows us to start a new note
			  	var gainNodeMaster = context.createGain();
			  	gainNodeMaster.connect(context.destination);
			  	
			  	//keeps track of which oscillators are active
			  	note[$(this).attr('oscnum')] = {
			  		osc: osc1,
			  		gainNode: gainNode1,
			  		masterGain: gainNodeMaster
			  	};
			  	
			  	//sets waveform based on dropdown
			  	osc1.type = waveform.text();

			  	//connect oscillator to gain node to master
			  	gainNode1.connect(gainNodeMaster);
			  	osc1.connect(gainNode1);

			  	ads( gainNode1.gain, gain.val(), gainAttack.val(), gainDecay.val(), gainSustain.val())
				//ads( gainNodeMaster.gain, )
				ads( gainNodeMaster.gain, masterVolume.val(), masterVolAttack.val(), masterVolDecay.val(), masterVolSustain.val() )	
				
				osc1.frequency.value = object.frequency;
				osc1.start(0);
			}
		});
	}		

	object.stopPiano = function () {
		$('.osc').each(function() {
			var el = $(this);
			var volumeRelease = el.find('.volrelease');
			var masterRelease = $('#mastercontrol .release');
			if(note[$(this).attr('oscnum')]){
				var osc = note[$(this).attr('oscnum')].osc;	
				var gainNode = note[$(this).attr('oscnum')].gainNode;
				var masterGain = note[$(this).attr('oscnum')].masterGain;

				function release(attribute, release) {
					attribute.cancelScheduledValues(context.currentTime);
					attribute.setValueAtTime(attribute.value, context.currentTime);
					attribute.linearRampToValueAtTime( 0, context.currentTime + parseFloat(release));
				}
				console.log()
				release( gainNode.gain, volumeRelease.val());
			}
		});

	}
}

//check if local storage is available
function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

//save function
function saveState() {
    if (!supportsLocalStorage()) { return false; }
    localStorage["synth.sesh.in.progress"] = seshInProgress;
    $(':input').each(function(){
    	if($(this).prop('type') === 'checkbox') {	
    		localStorage[$(this).data('identifier')] = $(this).is(':checked');
    	} else {
    		localStorage[$(this).data('identifier')] = $(this).val();
    	}
    });
    
    return true;
}

//load function
function loadState() {
	if (!supportsLocalStorage()) { return false; }
	if (!localStorage["synth.sesh.in.progress"]) { return false; }

	//event listener to save statee whenever and input is changed
	$(':input').each(function(){
		//check if it is a checkbox
	 	if (localStorage[$(this).data('identifier')] === 'true' || localStorage[$(this).data('identifier')] === 'false' ) {
    		$(this).prop( 'checked', localStorage[$(this).data('identifier')] != 'false');	
    	} else {
    		//set value of the input
    		$(this).val( localStorage[$(this).data('identifier')]);
    	}
    });
}

//function to create control panels - number is how many panels we want
function createOscControlPanels(number) {
	var oscControlPanel = $('.osc');
	var oscControlPanelWrapper = $('.controlpanelwrapper');
	
	for (var i = 0; i < number; i++) {
		var el = oscControlPanel.clone();
		el.show();
		el.attr('oscnum', i);
		el.find('input, select').each(function() {
			$(this).data('identifier', $(this).data('identifier') + $(this).parent().attr('oscnum'));
		});
		el.find('h2').text('Oscillator ' + (i + 1));
		oscControlPanelWrapper.append(el);
	}
	oscControlPanel.remove();

} 

$(function(){

	createOscControlPanels( 2 );
	
	loadState();

	//add audio properties to drum pad
	$('#sp div').each(function() {
		addAudioProperties(this);
	});

	$('#sp div').click(function() {
		this.play();
	});
	
	//array with charcodes for the computer keys in order of piano
	var keyboardStrokes = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p'];
	var keyToCharCode = [];

	for (var i = 0; i < keyboardStrokes.length; i++) {
		keyToCharCode.push(keyboardStrokes[i].charCodeAt(0)-32);
	}
	
	var current = 0;

	//assign frequency to keys
	$('.key').each(function() {
		this.frequency = calculateFrequency(current + 12 * parseFloat(document.getElementById('masteroctave').value), 130.81);
		$(this).data("frequency", current);
		addSynthProperties(this);
		$(this).attr('id', 'keynumber'+keyToCharCode[current]);
		current++;
	});

	//event listener for change octave - recalculates frequencies
	$('#masteroctave').on('input', function() {
		var octave = $(this).val();
		var currentCounter = $(this).val()*12;
		$('.key').each(function() {
			this.frequency = calculateFrequency(currentCounter, 130.81);
			$(this).data('frequency', currentCounter);
			addSynthProperties(this);
			currentCounter++;
		});
	});

	//save state when inputs are changed
	$(':input').change(function() {
			saveState();
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

