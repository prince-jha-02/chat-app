import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './db/mongodb.js';
import userRouter from './routes/user.route.js';
import cookieParser from "cookie-parser";
import friendRouter from './routes/friend.route.js';

// ✅ NEW IMPORTS
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket.js";

const app = express();
const port = process.env.PORT || 4000;

// DB connect
connectDB();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// ================= ROUTES =================
app.use('/api/user', userRouter);
app.use('/api/friend', friendRouter);

app.get('/', (req, res) => {
  res.send("API working");
});

// ================= SOCKET SETUP =================

// ❗ create HTTP server (IMPORTANT)
const server = http.createServer(app);

// ❗ initialize socket
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ❗ separate socket logic
setupSocket(io);

// ================= START SERVER =================
server.listen(port, () => {
  console.log("Server started on port: " + port);
});