var remoteVideo = document.getElementById('remoteVideo');
var muteBtn = document.getElementById('muteBtn');
var videoBtn = document.getElementById('videoBtn');
var statusText = document.getElementById('statusText');
var playbackControls = document.getElementById('playbackControls');

var meetingID = window.location.pathname.replace('/', '');
remoteVideo.hidden = true;
playbackControls.hidden = true;
if (meetingID.length <= 0) {
    statusText.innerText = 'Invalid meeting id!';
    throw new Error('Invalid meeting id!');
}

let localMedia;

let host = true;

function muteClicked() {
    if (localMedia) {
        const audioTrack = localMedia.getTracks().find(track => track.kind === 'audio');
        audioTrack.enabled = !audioTrack.enabled;
        muteBtn.innerText = audioTrack.enabled ? 'Mute' : "Unmute";
    }
}

function toggleVideoClicked() {
    if (localMedia) {
        const videoTrack = localMedia.getTracks().find(track => track.kind === 'video');
        videoTrack.enabled = !videoTrack.enabled;
        videoBtn.innerText = videoTrack.enabled ? 'Turn off video' : "Turn on video";
    }
}

function setupPeer(token) {
    statusText.innerText = "Connecting...";
    peer = new Peer(token, { debug: 0 });
    peer.on('error', function (err) {
        if (err.message.includes('not connect to peer')) {
            setupPeer(meetingID);
        } else {
            statusText.innerText = 'Invalid meeting id!';
        }
        console.error(err);
    })

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    getUserMedia({ video: true, audio: true }, function (stream) {
        localMedia = stream;
        console.log(localMedia);
    }, function (err) {
        console.log('Failed to get local stream', err);
    });

    peer.on('open', function (id) {
        console.log('my id is', id);
        statusText.innerText = "Waiting for other user";
        peer.on('call', function (call) {
            getUserMedia({ video: true, audio: true }, function (stream) {
                if (!localMedia) { localMedia = stream; }
                call.answer(localMedia);
                call.on('stream', function (remoteStream) {
                    statusText.innerText = "";
                    remoteVideo.srcObject = remoteStream;
                    remoteVideo.hidden = false;
                    playbackControls.hidden = false;
                });
            }, function (err) {
                console.log('Failed to get local stream', err);
            });

        });
        peer.on('connection', function (conn) {
            getUserMedia({ video: true, audio: true }, function (stream) {
                if (!localMedia) { localMedia = stream; }
                var vidConn = peer.call(conn.peer, localMedia);
                remoteVideo.hidden = false;
                playbackControls.hidden = false;
                vidConn.on('stream', function (remoteStream) {
                    statusText.innerText = "";
                    remoteVideo.srcObject = remoteStream;
                    remoteVideo.hidden = false;
                    playbackControls.hidden = false;
                });
            }, function (err) {
                console.log('Failed to get local stream', err);
            });
        });
        if (token !== null && token !== undefined && token.length > 0) {
            return;
        }
        host = false;

        peer.connect(meetingID);
    });
}

setupPeer();