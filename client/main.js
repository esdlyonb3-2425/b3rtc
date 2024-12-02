const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const buttonVideo = document.querySelector('#startButton');

let localStream;
let peerConnection;

const signalingServer = new WebSocket('ws://127.0.0.1:8080');
const configuration = {
    iceServers: [
        {
            url: 'stun:stun.l.google.com:19302',
        }
    ]
}

signalingServer.onopen = ()=>{
    console.log('Signaling server connected');
};

signalingServer.onmessage = (message) => {

    const data = JSON.parse(message.data);
    if(data.offer){
        handleOffer(data.offer)
    }else if(data.answer)
    {
        handleAnswer(data.answer)
    }else if(data.iceCandidate)
    {
        handleNewICECandidate(data.iceCandidate)
    }
}

buttonVideo.onclick = async ()=>{
    try{
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio : true})
        localVideo.srcObject = localStream

        peerConnection = new RTCPeerConnection(configuration)

        localStream.getTracks().forEach(track => {peerConnection.addTrack(track, localStream)});

        peerConnection.onicecandidate = (event)=>{
            if(event.candidate){
                signalingServer.send(JSON.stringify({iceCandidate: event.iceCandidate}))
            }
        }

        peerConnection.ontrack = (event)=>{
            remoteVideo.srcObject = event.streams[0]
        }
        const offer = await peerConnection.createOffer();

        await peerConnection.setLocalDescription(offer)
        signalingServer.send(JSON.stringify({offer: offer}))

    }catch(e){
        console.log(e)
    }
}

const handleOffer = async (offer) => {

try{
    peerConnection = new RTCPeerConnection(configuration);

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    })

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    signalingServer.send(JSON.stringify({answer: answer}));

    peerConnection.onicecandidate = (event) => {

        if(event.candidate){
            signalingServer.send(JSON.stringify({iceCandidate: event.candidate}));
        }
    }

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0]
    }

}catch(err){
    console.log('offer error' , err)
}

}


const handleAnswer = async (answer) => {

    try{
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }catch(err){
        console.log(err);
    }

}

const handleNewICECandidate = async (iceCandidate) => {
    try{
        await peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
    }catch(e){
        console.error('ICE Candidate error:', e);
    }
}