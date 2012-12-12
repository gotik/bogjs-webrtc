window.RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
window.URL = window.URL ||window.webkitURL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var
	pc1 = null,
	pc2 = null,

	dc1 = null,
	dc2 = null,

	stream1 = null,

	config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]}
;


function initPeerConnection() {
	pc1 = new RTCPeerConnection(config);
	pc2 = new RTCPeerConnection(config);

	pc1.onicecandidate = onIceCandidate1;
	pc2.onicecandidate = onIceCandidate2;

	pc1.onopen = onOpen1;
	pc2.onopen = onOpen2;

	pc1.onconnection = onConnection1;
	pc2.onconnection = onConnection2;

	pc1.ondatachannel = onDataChannel1;
	pc2.ondatachannel = onDataChannel2;

	pc1.addStream(stream1);

	pc2.onaddstream = onAddStream2;

	pc1.createOffer(onCreateOffer1);
}

function onDataChannel1(channel) {
	console.log("[1] DATA: ", channel);
}

function onDataChannel2(channel) {
	console.log("[2] DATA: ", channel);

	d2 = channel;

	setTimeout(eventChannel, 1000);
}

function eventChannel() {
	d2.onmessage = function(event) {
		console.log("[2] RCV: ", event);
	};
}

function onOpen1(event) {
	console.log("[1] OPEN: ", event);
}

function onOpen2(event) {
	console.log("[2] OPEN: ", event);
}

function onConnection1(event) {
	console.log("[1] CONN: ", event);

	dc1 = pc1.createDataChannel("This is pc1", {});
}

function onConnection2(event) {
	console.log("[2] CONN: ", event);
}

function onIceCandidate1(event) {
	console.log("[1] ICE: ", event);
	if (event.candidate) {
		pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
	}
}

function onIceCandidate2(event) {
	console.log("[2] ICE: ", event);
	if (event.candidate) {
		pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
	}	
}

function onAddStream2(event) {
	console.log("[2] STREAM: ", event);

	video2.src = URL.createObjectURL(event.stream);

	video2.addEventListener('loadedmetadata', function(e) {
		this.play();

		setTimeout(fireConnection, 2000);
	});
}

function fireConnection() {
	pc1.connectDataConnection(5000, 5001);
	pc2.connectDataConnection(5001, 5000);
	// dispara el connection
}

function onCreateOffer1(offer) {
	console.log("[1] OFFER: ", offer);

	pc1.setLocalDescription(offer);

	// firefox bug = colombian fix
	setTimeout(function() {
		pc2.setRemoteDescription(offer);
		setTimeout(function() {
			pc2.createAnswer(onCreateAnswer2);
		}, 1000)
	}, 1000);
}

function onCreateAnswer2(answer) {
	console.log("[2] ANSWER: ", answer);

	pc2.setLocalDescription(answer);
	pc1.setRemoteDescription(answer);
}



/* Test */


var video1 = document.getElementById('video1');
var video2 = document.getElementById('video2');

function onGetUserMediaSuccess(stream) {
	console.log("GOT STREAM", stream);
	stream1 = stream;

	video1.src = URL.createObjectURL(stream);

	video1.addEventListener('loadedmetadata', function(e) {
		this.play();
		initPeerConnection();
	});
}

function onGetUserMediaError(error) {
	console.log("[1] GETUSERMEDIA (ERROR): ", error);
}

function init() {
	navigator.getUserMedia({audio:true, fake:true}, onGetUserMediaSuccess, onGetUserMediaError);
}
