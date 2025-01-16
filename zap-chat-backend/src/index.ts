import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
  isTyping: boolean;
}

let allSockets: User[] = [];

function broadcastTypingStatus(room: string, excludeSocket?: WebSocket) {
  const typingUsers = allSockets.filter(
    (user) =>
      user.room === room && user.isTyping && user.socket !== excludeSocket
  ).length;

  const typingMessage = {
    type: "typing_status",
    payload: {
      count: typingUsers,
    },
  };

  allSockets.forEach((user) => {
    if (user.room === room && user.socket !== excludeSocket) {
      user.socket.send(JSON.stringify(typingMessage));
    }
  });
}

wss.on("connection", (socket) => {
  //console.log("user connected #" + userCount);

  socket.on("message", (message) => {
    let parsedMessage;

    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      console.error("Invalid JSON received", message);
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid JSON format" })
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
        allSockets.push({
          socket,
          room: parsedMessage.payload.roomId,
          isTyping: false,
        });
      } else {
        existingUser.room = parsedMessage.payload.roomId;
        console.log("User switched room " + parsedMessage.payload.roomId);
        existingUser.isTyping = false;
      }
    }

    if (parsedMessage.type === "typing_status") {
      const currentUser = allSockets.find((x) => x.socket === socket);

      if (!currentUser) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "You should join a room first",
          })
        );
        return;
      }

      const isTyping = parsedMessage.payload.isTyping;
      currentUser.isTyping = isTyping;
      broadcastTypingStatus(currentUser.room, socket);
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

      currentUser.isTyping = false;
      broadcastTypingStatus(currentUser.room);

      console.log(`User in room ${currentUser.room} wants to chat`);

      const currentUserRoom = currentUser.room;
      allSockets.forEach((user) => {
        if (user.room === currentUserRoom) {
          user.socket.send(
            JSON.stringify({
              type: "chat",
              payload: { message: parsedMessage.payload.message },
            })
          );
        }
      });
    }
  });

  // If any socket dies, remove it from the sockets array
  socket.on("close", () => {
    const disconnectedUser = allSockets.find((x) => x.socket === socket);
    if (disconnectedUser) {
      const room = disconnectedUser.room;
      allSockets = allSockets.filter((x) => x.socket !== socket);
      broadcastTypingStatus(room); // Update typing status for remaining users
      console.log("Socket disconnected, removed from room");
    }
  });
});
