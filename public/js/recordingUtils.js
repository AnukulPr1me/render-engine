import * as store from "./store.js";

let mediaRecorder;

const vp9 = "video/webm; codecs=vp=9";
const vp9Options = {MimeType: vp9Codec};

export const StartRecording = () => {
    const recordStream = store.getState().remoteStream;

    if(mediaRecorder.isTypeSupported(vp9Codec)){
        mediaRecorder = new MediaRecorder(recordStream, vp9Options);
    }else {
        mediaRecorder = new MediaRecorder(remoteStream);
    }
    mediaRecorder.ondataavailable = handelDataAvailable;

    mediaRecorder.start();
}

export const pauseRecording = () => {
    mediaRecorder.pause();
}

export const resumeRecording = () => {
    mediaRecorder.resume();
}

export const stopRecording = () => {
    mediaRecorder.stop();

}


const downloadRecordedVideo = () => {
    const blob = new Blob(recorderChunksk, {
        type: 'video/webm'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none;';
    a.href = url;
    a.download ='recordedVideo.webm';
    a.click();
    window.URL.revokeObjectURL(url);
}

const handelDataAvailable = (event) => {
    if(event.data.size >0){
        recorderChunks.push(event.data);
        downloadRecordedVideo();
    }
}