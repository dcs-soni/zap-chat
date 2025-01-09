"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let userCount = 0;
let allSockets = [];
wss.on("connection", (socket) => {
    allSockets.push(socket);
    userCount += 1;
    console.log("user connected #" + userCount);
    socket.on("message", (message) => {
        console.log("mesage received" + message.toString());
        allSockets.forEach((s) => {
            s.send(message.toString() + " sent from the server");
        });
    });
});
