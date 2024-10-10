# WE - WebRTC Video Chat Application

## Project Overview

**WE** is a real-time video chat and messaging application built using WebRTC, JavaScript, HTML, and CSS. This project allows users to connect with others through video calls, share their screens, and engage in text-based chatting. Users can either connect with someone directly using a personal code or talk to a stranger by enabling the random chat feature. Additionally, the app includes the functionality to record video calls and chat sessions for later reference.

The key technologies used in this project include WebRTC for peer-to-peer (P2P) communication, Socket.IO for managing connections between users, and vanilla JavaScript for managing the UI.

## Features

1. **Video Calling with Personal Code**  
   Users can make video calls by sharing a unique code with each other. Both parties enter the code to establish a connection, ensuring a private and direct line of communication.

2. **Screen Sharing**  
   During a video call, users can share their screen with the other party. This feature is ideal for presentations, remote collaboration, or helping someone with technical issues.

3. **Text Chatting**  
   In addition to video calls, users can send text messages during their conversation, allowing for both verbal and written communication.

4. **Connect with Strangers**  
   If a user prefers to meet new people, they can enable the "Talk to a Stranger" feature by checking a checkbox and clicking on the video or chat button. The system will attempt to pair them with a random available user for either a video call or text chat.

5. **Recording**  
   Users can record their video calls or screen-sharing sessions, capturing both video and audio. This can be useful for saving important conversations or sharing the recording with others.

## Core Technologies & Concepts

1. **WebRTC Implementation**  
   WebRTC (Web Real-Time Communication) enables real-time, peer-to-peer video, audio, and data communication directly between web browsers. This is the backbone of the WE application, allowing users to connect without the need for a central server.

2. **Peer-to-Peer (P2P) Connection**  
   Establishing direct connections between users ensures fast, secure communication without the need for large server infrastructures.

3. **Working with Media Streams**  
   The application captures video and audio streams from the user's webcam and microphone using WebRTC and shares them during the video call.

4. **WebRTC Data Channels**  
   Data channels are used for sending text messages and other forms of data between peers, ensuring that both media and data communication are seamlessly integrated.

5. **Socket.IO Server**  
   The application uses Socket.IO to handle the signaling process that establishes peer-to-peer connections. This includes exchanging information about available media streams, codecs, and network configurations.

6. **Real-Time Communication**  
   WebRTC combined with Socket.IO enables real-time audio, video, and text communication, ensuring a smooth and responsive experience.

7. **Front-End with Vanilla JavaScript**  
   The entire user interface (UI) is built using vanilla JavaScript, HTML, and CSS. This includes handling media streams, displaying video feeds, managing chat functionality, and enabling dynamic interaction without the need for any external frameworks.

8. **Stream Recording**  
   Users have the ability to record ongoing streams, whether it's a video call or screen sharing. This ensures that important conversations or demonstrations can be saved for later use.

## Getting Started

To run this project on your local machine, follow these steps:

1. Clone the repository:  
   ```bash
   git clone https://github.com/anukulpr1me/we.git
   cd we
