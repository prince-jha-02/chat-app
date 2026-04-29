import jwt from "jsonwebtoken";
import { Message } from "./models/message.model.js";

export const setupSocket = (io) => {

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {

    // ✅ FIX HERE
    console.log("User connected:", socket.user._id);

    // ✅ FIX HERE
    socket.join(socket.user._id);

    socket.on("sendMessage", async ({ receiverId, text }) => {
      try {
        const message = await Message.create({
          // ✅ FIX HERE
          sender: socket.user._id,
          receiver: receiverId,
          text
        });

        io.to(receiverId).emit("receiveMessage", message);
        socket.emit("messageSent", message);

      } catch (err) {
        console.log(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};