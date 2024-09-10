const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 7000;

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
                callerSockerId: socket.id,
                callType,
            };

            io.to(calleePersonalCode).emit('pre-offer', data);
        }
    });


    socket.on("disconnect", () => {
        console.log("user disconnected");
        const newConnectedPeers = connectedPeers.filter((peerSocketId) => peerSocketId !== socket.io);
        connectedPeers = newConnectedPeers;
        console.log(connectedPeers);
    });
});

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
