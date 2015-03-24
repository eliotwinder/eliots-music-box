window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new window.AudioContext();

//calculate the frequency of a note based on start (hz); pitch is halfsteps away from a4
function calculateFrequency(pitch, start){
	var noteFrequency = start*Math.pow(Math.pow(2,1/12),pitch);
	return noteFrequency;
}

//calculate frequency n steps away from a given frequency - i'm using 130.81 (c3) as constant here, but it could be anything
function pitchChange( n, freq, anchor ) {

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

//set up ginal gain node for oscillator
var analyser = context.createAnalyser();
analyser.fftSize = 256;
var destGain = context.createGain();
destGain.connect(analyser);
analyser.connect(context.destination);

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
			var octave =el.find('.octave');			
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
				  	attribute.cancelScheduledValues(context.currentTime);
				  	//set envelope to zero to add attack
					attribute.setValueAtTime(0,context.currentTime);
					
					//attack envelope - 1st arg is target volume for top of attack (from oscillator), 2nd arg is time 
					attribute.linearRampToValueAtTime( parseFloat(level), context.currentTime + parseFloat(attack));
					
					//decay	
					attribute.linearRampToValueAtTime( parseFloat(sustain)*parseFloat(level), context.currentTime + parseFloat(decay) + parseFloat(attack));	
			  	}

			  	

			if(onoff.prop('checked') == true) {
				var osc = context.createOscillator();
			  	//this channel's gain node
			  	var gainNode1 = context.createGain();
			  	//pseudo master gain node: this gain node will be the same in all oscillators, mimicking a master channel, but allows us to start a new note
			  	var gainNodeMaster = context.createGain();
			  	gainNodeMaster.connect(destGain);
			  	
			  	//keeps track of which oscillators are active
			  	note[$(this).attr('oscnum')] = {
			  		osc: osc,
			  		gainNode: gainNode1,
			  		masterGain: gainNodeMaster
			  	};
			  	
			  	//sets waveform based on dropdown
			  	osc.type = waveform.text();

			  	//connect oscillator to gain node to master
			  	gainNode1.connect(gainNodeMaster);
			  	osc.connect(gainNode1);

			  	ads( gainNode1.gain, gain.val(), gainAttack.val(), gainDecay.val(), gainSustain.val());
				//ads( gainNodeMaster.gain, )
				ads( gainNodeMaster.gain, masterVolume.val()*gain.val(), masterVolAttack.val(), masterVolDecay.val(), masterVolSustain.val() );	
				
				//frequency is the note + octave for master and octave for this osc
				osc.frequency.value = object.frequency;
				osc.start(0);
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

	//cycles through inputs and assigns saved values
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
		el.css('display', 'inline-block');
	
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
	//create an array with frequencies starting from the bottom note
	var numberOfOscillators =2;

	createOscControlPanels( numberOfOscillators );
	
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
		this.frequency = calculateFrequency( current + 12 * parseFloat(document.getElementById('masteroctave').value), 130.81);
		$(this).data("frequency", current);
		addSynthProperties(this);
		$(this).prop('id', 'keynumber'+keyToCharCode[current]);
		current++;
	});


	//event listener for change octave - recalculates frequencies
	$('#masteroctave').on('input', function() {
		var octave = $(this).val();
		var currentCounter = $(this).val()*12;
		$('.key').each(function() {
			for (var i = 0; i < numberOfOscillators; i++){
				this.frequency = calculateFrequency(currentCounter, 130.81);
				$(this).data('frequency', currentCounter);
			}
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

	//draw the oscilloscope
	oscilloscope();
});

