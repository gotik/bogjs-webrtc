// vendor
window.RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// dom
var dom = {
	localVideo: document.getElementById("local-video"),
	remoteVideo: document.getElementById("remote-video"),
	newChannel: document.getElementById("new-channel"),
	joinChannel: document.getElementById("join-channel")
};

//var config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var config = {"iceServers": []}; // funca en red local
var pc = new RTCPeerConnection(config);

var localStream = null;

// usermedia
navigator.getUserMedia({video:true, audio:true}, onGetUserMediaSuccess, onGetUserMediaError);

// callbacks usermedia
function onGetUserMediaSuccess(stream) {
	console.log("[local] STREAM", stream);

	dom.localVideo.src = URL.createObjectURL(stream);
	dom.localVideo.addEventListener('loadedmetadata', onLocalStreamReady);

	localStream = stream;

}
function onGetUserMediaError(error) {
	console.log("[local] ERROR: ", error);
}

// callbacks video
function onLocalStreamReady(event) {
	console.log(event);

	// firefox bug
	this.play();
	pc.addStream(localStream);



}

// websocket
var socket = io.connect('http://192.168.1.26:8080');

socket.on('resNew', function(data) {
	dom.newChannel.innerHTML = data;
});

// 
socket.on('resJoin', function(data) {

	pc.createOffer(onCreateOffer);
});

function reqNew() {
	if(socket && localStream) {
		socket.emit('reqNew');
	} else {
		console.log("[local] ERROR: socket null");
	}
}

function reqJoin() {
	var ch = dom.joinChannel.value;
	if(socket && ch && localStream) {
		socket.emit('reqJoin', ch);
	} else {
		console.log("[local] ERROR: socket null or FOKIU");
	}
}



// peerConnection


function onCreateOffer(offer) {
	pc.setLocalDescription(offer);

	socket.emit('reqOffer', offer);
}

socket.on('resOffer', function(offer) {
	console.log(offer);
	pc.setRemoteDescription(new RTCSessionDescription(offer));

	pc.createAnswer(onCreateAnswer);
});


function onCreateAnswer(answer) {
	pc.setLocalDescription(answer);

	socket.emit('reqAnswer', answer);
}

socket.on('resAnswer', function(answer) {
	console.log(answer);
	pc.setRemoteDescription(new RTCSessionDescription(answer));

});


pc.onaddstream = onAddStream;
pc.onicecandidate = onIceCandidate;

pc.onopen = onOpen;

function onAddStream(event) {

	console.log("ON ADD STREAM :D");

	dom.remoteVideo.src = URL.createObjectURL(event.stream);

	dom.remoteVideo.addEventListener('loadedmetadata', function() {
		this.play();
	});
}

function onOpen(event) {
	console.log("OPEN: ", event);

	//navigator.getUserMedia({video:true, audio:true}, onGetUserMediaSuccess, onGetUserMediaError);
}

function onIceCandidate(event) {
	console.log("ICE: ", event);

	socket.emit("reqIce", event.candidate);

}

socket.on("resIce", function(candidate) {
	pc.addIceCandidate(new RTCIceCandidate(candidate));
});

