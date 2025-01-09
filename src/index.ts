import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
  //console.log("user connected #" + userCount);

  socket.on("message", (message) => {
    // @ts-ignore

    let parsedMessage;

    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      console.error("Invalid JSON received", message);
      socket.send(
        JSON.stringify({ type: error, message: "Invalid JSON format" })
      );
      return;
    }

    if (!parsedMessage) {
      console.error("Message type is missing");
      socket.send(
        JSON.stringify({ type: "error", message: "Message type is requried" })
      );
    }

    if (parsedMessage.type === "join") {
      const existingUser = allSockets.find((x) => x.socket == socket);

      if (!parsedMessage.payload.roomId) {
        console.log("roomId is missing in join message");
        socket.send(
          JSON.stringify({
            error: "error",
            message: "roomId is required to join the room",
          })
        );
        return;
      }
      if (!existingUser) {
        console.log("User joined room " + parsedMessage.payload.roomId);
        allSockets.push({ socket, room: parsedMessage.payload.roomId });
      } else {
        existingUser.room = parsedMessage.payload.roomId;
        console.log("User switched room " + parsedMessage.payload.roomId);
      }
    }

    if (parsedMessage.type == "chat") {
      const currentUser = allSockets.find((x) => x.socket == socket);

      if (!currentUser) {
        console.error("Socket not associated with any room");
        socket.send(
          JSON.stringify({
            type: "error",
            message: "You must join a room before chatting",
          })
        );
        return;
      }

      if (!parsedMessage.payload.message) {
        console.error("Message content is missing");
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Message content is required",
          })
        );
        return;
      }

      console.log(`User in room ${currentUser.room} wants to chat`);

      const currentUserRoom = currentUser.room;
      allSockets.forEach((user) => {
        if (user.room === currentUserRoom) {
          user.socket.send(parsedMessage.payload.message);
        }
      });
    }
  });

  // If any socket dies, remove it from the sockets array
  socket.on("close", () => {
    allSockets = allSockets.filter((x) => x.socket !== socket);
    console.log("Socket disconnected, removed from room");
  });
});
