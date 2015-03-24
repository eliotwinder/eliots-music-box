//canvas property variables
var canvasWidth = 350;
var canvasHeight = 150;

function oscilloscope(){
	//set up canvas
	var canvas = document.getElementById("scope");
	window.canvasCtx = scope.getContext("2d");	

	
	//create variable for the info coming from the analyser, and put it into a UInt8Array so that it can hold the data 
	
	var bufferLength = analyser.frequencyBinCount;
	var freqDomain = new Uint8Array(analyser.frequencyBinCount);
	var timeDomain = new Uint8Array(analyser.frequencyBinCount);
	
	//clear canvas
	canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

	function draw() {
		//keep looping draw when it has started
		drawVisual = requestAnimationFrame(draw);

		//set a variable to the array the data is coming from - inside draw function so it resets every frame
		analyser.getByteFrequencyData(freqDomain);
		analyser.getByteTimeDomainData(timeDomain);
		
		//draw a bg
		canvasCtx.fillStyle = 'rgb(200, 200, 200)';
			canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);

		//////Frequency wave
		barWidth = (canvasWidth / bufferLength );
		var barHeight;
		var x = 0;

		for(var i = 0; i < bufferLength; i++) {
	        barHeight = freqDomain[i]/2;

	        canvasCtx.fillStyle = 'rgb(' + (100 + x)  + ',50,50)';
	        canvasCtx.fillRect(x,canvasHeight-barHeight,barWidth,barHeight);

	        x += barWidth;
	      }

	  	canvasCtx.lineTo(canvas.width, canvas.height/2);
	  	canvasCtx.stroke();

	  	//////Gain wave
		
		//set the line for the wave
		canvasCtx.lineWidth = 2;
			canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
	      	canvasCtx.beginPath();

	    //figure out how wide each slice should be by dividing the width of the canvas by sample rate
	    var sliceWidth = canvasWidth * 1 / bufferLength;
	    var x = 0;

	    for(var i = 0; i < bufferLength; i++) {
	        var v = timeDomain[i] / 128.0;
	        var y = v * canvasHeight/2;

	        if(i === 0) {
	          canvasCtx.moveTo(x, y);
	        } else {
	          canvasCtx.lineTo(x, y);
	        }

	        x += sliceWidth;
	    }

	  	canvasCtx.lineTo(canvas.width, canvas.height/2);
	  	canvasCtx.stroke();

	}

	draw();
}

