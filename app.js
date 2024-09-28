const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 7001;

app.use(express.static("public"));
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

let connectedPeers = [];
 

io.on('connection', (socket) => {
    connectedPeers.push(socket.id);
    console.log(connectedPeers);
    socket.on("pre-offer", (data) =>{
        console.log("pre offer come");
        const {calleePersonalCode, callType} = data;
        const connectedPeer = connectedPeers.find((peerSocketId) => 
            peerSocketId === calleePersonalCode
        );

        console.log(connectedPeer);

        if(connectedPeer){
            const data = {
                callerSocketId: socket.id,
                callType,
            };

            io.to(calleePersonalCode).emit('pre-offer', data);
        }
        else{
            const data = {preOfferAnswer: 'CALLEE_NOT_FOUND',};
            io.to(socket.id).emit('pre-offer-answer', data);
        } 

    });

    socket.on('pre-offer-answer', (data) => {
        console.log("pre offer answer come");
        console.log(data);
        const {callerSocketId} = data;
        const connectedPeer = connectedPeers.find(
            (peerSocketId) => peerSocketId === callerSocketId
        );

        if(connectedPeer){
            io.to(data.callerSocketId).emit('pre-offer-answer', data);
        }
    });

    socket.on('webRTC-signaling', (data) => {
        const {connectedUserSocketId} = data;

        const connectedPeer = connectedPeers.find(
            (peerSocketId) => peerSocketId ===  connectedUserSocketId
        );

        if(connectedPeer){
            io.to(connectedUserSocketId).emit("webRTC-signaling", data);
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
        const newConnectedPeers = connectedPeers.filter((peerSocketId) => peerSocketId !== socket.id);
        connectedPeers = newConnectedPeers;
        console.log(connectedPeers);
    });
});

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
