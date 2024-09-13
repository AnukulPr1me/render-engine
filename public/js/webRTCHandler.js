import * as wss from "./wss.js";
import * as constants from "./const.js";
import  * as ui from "./ui.js";
import * as store from "./store.js";

let connectedUserDetails;
let peerConnection;

const defaultConstraints = {
  audio: true,
  video: true
}

const configuration = {
  iceServers: [
    {
      urls: 'stun: stun.1.google.com:13902'
    }
  ]
}

export const getLocalPreview = () => {
  navigator.mediaDevices.getUserMedia(defaultConstraints).then((stream) => {
    ui.updateLocalVideo(stream);
    store.setLocalStream(stream);
  }).catch((err) => {
  console.log("error occured when trying to get an access to camera");
  console.log(err);
  });
};
const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    console.log("geeting ice candiadates from stun server");
    if(event.candidate){

    }
  }

  peerConnection.onconnectionstatechange = (event) => {
    if(peerConnection.connectionState === 'connected') {
      console.log("succesfully onnected with other peer");
    }
  }

  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  }
  if(connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE){
    const localstream = store.getState().localStream;

    for(const track of localstream.getTracks()){
      peerConnection.addTrack(track, localstream);
    }
  }
};

export const sendPreOffer = (callType, calleePersonalCode) =>  {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode
  }

  if(callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE) {
    const data = {
      callType,
      calleePersonalCode
    }
    ui.showCallingDialog(callingDialogRejectCallHandler)
    wss.sendPreOffer(data); 
  }

};

export const handlePreOffer = (data) => {
  const {callType, callerSocketId} = data;

  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };
  if(callType === constants.callType.CHAT_PERSONAL_CODE || callType === constants.callType.VIDEO_PERSONAL_CODE){
     ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }
};

const acceptCallHandler = () => {
  console.log("call accepted");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
  console.log("call rejected");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const callingDialogRejectCallHandler = () => {
  console.log("rejecting the call");
}

const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedUserDetails.socketId,
    preOfferAnswer
  }
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
}

export const handlePreOfferAnswer = (data) => {
  const {preOfferAnswer}= data;
  console.log('pre offer answer come');
  console.log(data);

  ui.removeAllDialogs();
  
  if(preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    ui.showInfoDialog(preOfferAnswer); 
  }

  if(preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    ui.showInfoDialog(preOfferAnswer);
  }

  if(preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    ui.showInfoDialog(preOfferAnswer);
  }

  if(preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    ui.showCallElements(connectedUserDetails.callType);
  }
}
