import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let userCount = 0;

let allSockets: WebSocket[] = [];

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

  // If any socket dies, remove it from the sockets array
  socket.on("disconnect", () => {
    allSockets = allSockets.filter((x) => x != socket);
  });
});
