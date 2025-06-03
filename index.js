const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  if (waitingUsers.length > 0) {
    const partner = waitingUsers.pop();
    partner.partnerId = socket.id;
    socket.partnerId = partner.id;

    partner.emit("partner-found", socket.id);
    socket.emit("partner-found", partner.id);
  } else {
    waitingUsers.push(socket);
  }

  socket.on("message", (msg) => {
    const partner = io.sockets.sockets.get(socket.partnerId);
    if (partner) {
      partner.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) waitingUsers.splice(index, 1);

    if (socket.partnerId) {
      const partner = io.sockets.sockets.get(socket.partnerId);
      if (partner) {
        partner.partnerId = null;
        partner.emit("partner-disconnected");
        waitingUsers.push(partner);
      }
    }
  });
});

app.use(express.static("client"));

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
