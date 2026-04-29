import { io } from "socket.io-client";

// 🔁 replace with YOUR token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWI4MjE1YzViMTVlZGYzOTM0MjBjNWQiLCJlbWFpbCI6ImpoYXByaW5jZTk5MTA0QGdtYWlsLmNvbSIsImlhdCI6MTc3NTQ4NTYwNywiZXhwIjoxNzc1NTcyMDA3fQ.PzOGGtIKDHkxcNoYxCo8OJvoIOHLnBQuRIaj4YdkRMo"

// 🔁 replace with OTHER USER ID
const receiverId = "69cbdd039a76f36170ff1b89";

const socket = io("http://localhost:8000", {
  auth: {
    token: token
  }
});

// connected
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // send message
  socket.emit("sendMessage", {
    receiverId,
    text: "Hello from test script 🚀"
  });
});

// receive message
socket.on("receiveMessage", (msg) => {
  console.log("📩 Received:", msg);
});

// confirmation
socket.on("messageSent", (msg) => {
  console.log("✅ Sent:", msg);
});

// errors
socket.on("connect_error", (err) => {
  console.log("❌ Error:", err.message);
});