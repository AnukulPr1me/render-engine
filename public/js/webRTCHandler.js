import * as wss from "./wss.js";
import * as constants from "./const.js";
import * as ui from "./ui.js";
import * as store from "./store.js";

let connectedUserDetails;
let peerConnection;
let dataChannel;

const defaultConstraints = {
  audio: true,
  video: true,
};

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const getLocalPreview = () => {
  navigator.mediaDevices
    .getUserMedia(defaultConstraints)
    .then((stream) => {
      ui.updateLocalVideo(stream);
      ui.showVideoCallButtons();
      store.setCallState(constants.callState.CALL_AVAILABLE);
      store.setLocalStream(stream);
    })
    .catch((err) => {
      console.log("error occured when trying to get an access to camera");
      console.log(err);
    });
};
const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  dataChannel = peerConnection.createDataChannel('chat');
  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;

    dataChannel.onopen = () => {
      console.log("peer connection is open to receive data channel message");
    };
    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("received message from data channel");
      ui.appendMessage(message);
    
    };
  }
  peerConnection.onicecandidate = (event) => {
    console.log("getting ice candiadates from stun server");
    if (event.candidate) {
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      });
    }
  };

  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === "connected") {
      console.log("successfully connected with other peer");
    }
  };

  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };
  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_STRANGER
  ) {
    const localstream = store.getState().localStream;

    for (const track of localstream.getTracks()) {
      peerConnection.addTrack(track, localstream);
    }
  }
};

export const sendMessageUsingDataChannel = (message) => {
  const stringifiedMessage = JSON.stringify(message);
  dataChannel.send(stringifiedMessage);
}

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    ui.showCallingDialog(callingDialogRejectCallHandler);
    store.setCallState(constants.callState.CALL_UNAVAILABLE);
    wss.sendPreOffer(data);
  }

  if(callType === constants.callType.CHAT_STRANGER ||
    callType === constants.callType.VIDEO_STRANGER){
      const data = {
        callType,
        calleePersonalCode,
      };
      store.setCallState(constants.callState.CALL_UNAVAILABLE);
      wss.sendPreOffer(data);
    }
};

export const handlePreOffer = (data) => {
  const { callType, callerSocketId } = data;

  if(!checkCallPossibility()){
    return sendPreOfferAnswer(constants.preOfferAnswer.CALL_UNAVAILABLE, callerSocketId);
  }

  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  store.setCallState(constants.callState.CALL_UNAVAILABLE);

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }

  if(callType === constants.callType.CHAT_STRANGER ||
    callType === constants.callType.VIDEO_STRANGER){
      createPeerConnection();
      sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
      ui.showCallElements(connectedUserDetails.callType);
    }
};

const acceptCallHandler = () => {
  console.log("call accepted");
  createPeerConnection();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
  console.log("call rejected");
  sendPreOfferAnswer();
  setIncomingCallAvailable();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const callingDialogRejectCallHandler = () => {
  console.log("rejecting the call");
  const data={
    connectedUserDetails: connectedUserDetails.socketId
  }
  closePeerConnectionAndResetState();
  wss.sendUserHangedUp(data);
};

const sendPreOfferAnswer = (preOfferAnswer, callerSocketId = null) => {
  const socketId = callerSocketId ? callerSocketId : connectedUserDetails.socketId;
  const data = {
    callerSocketId: socketId,
    preOfferAnswer,
  };
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
};

export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;
  console.log("pre offer answer came");
  console.log(data);

  ui.removeAllDialogs();

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    setIncomingCallAvailable();
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    setIncomingCallAvailable();
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    setIncomingCallAvailable();
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    ui.showCallElements(connectedUserDetails.callType);
    createPeerConnection();
    sendWebRTCOffer();
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  });
};

export const handleWebRTCOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  });
  console.log("web rtc offer came");
  console.log(data);
};

export const handleWebRTCAnswer = async (data) => {
  console.log("web rtc answer came");
  await peerConnection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async (data) => {
  console.log("web rtc ice candidate came");
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error("Error adding ice candidate:", err);
  }
};

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async (
  screenSharingActive
) => {
  if (screenSharingActive) {
    const localStream = store.getState().localStream;
    const senders = peerConnection.getSenders();
    const sender = senders.find((sender) => {
      return sender.track.kind === localStream.getVideoTracks()[0].kind;
    });
    if (sender) {
      sender.replaceTrack(localStream.getVideoTracks()[0]);
    }
    store
      .getState()
      .screenSharingStream.getTracks()
      .forEach((track) => track.stop());
    store.setScreenSharingActive(!screenSharingActive);
    ui.updateLocalVideo(localStream);
  } else {
    console.log("Switch between camera and screen sharing");
  }
  try {
    screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    store.setScreenSharingStream(screenSharingStream);
    const senders = peerConnection.getSenders();
    const sender = senders.find((sender) => {
      return sender.track.kind === screenSharingStream.getVideoTracks()[0].kind;
    });
    if (sender) {
      sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
    }
    store.setScreenSharingActive(!screenSharingActive);
    ui.updateLocalVideo(screenSharingStream);
  } catch (err) {
    console.error("error occurred while sharing screen", err);
  }
};


export const handleHangUp = () => {
  console.log("hanging up");
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  }
  wss.sendUserHangedUp(data);
  closePeerConnectionAndResetState();
}

export const handleConnectedUserHangedUp = () => {
  console.log("connected peer hanged up");
  closePeerConnectionAndResetState();
}

const closePeerConnectionAndResetState = () => {
  if(peerConnection){
    peerConnection.close();
    peerConnection = null;
  }

  if(connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constants.callType.VIDEO_STRANGER){
    store.getState().localStream.getVideoTracks()[0].enabled = true;
    store.getState().localStream.getAudioTracks()[0].enabled = true;
  }
  ui.updateUIAfterHangUp(connectedUserDetails.callType);
  setIncomingCallAvailable();
  connectedUserDetails = null;
};

const checkCallPossibility = (callType) => {
  const callState = store.getState().callState;

  if( callState === constants.callState.CALL_AVAILABLE){
    return true;
  }

  if((callType === constants.callType.VIDEO_PERSONAL_CODE || callType === constants.callType.VIDEO_STRANGER) && callState===constants.callState.CALL_AVAILABLE_ONLY_CHAT) {
    return false;
  }
  return false;
}

const setIncomingCallAvailable = () => {
  const localStream = store.getState().localStream;

  if(localStream){
    store.setLocalStream(constants.callState.CALL_AVAILABLE);
  }else{
    store.setLocalStream(constants.callState.CALL_AVAILABLE_ONLY_CHAT);
  }
}
