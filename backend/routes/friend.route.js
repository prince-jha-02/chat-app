
import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  
  rejectFriendRequest,
  searchUsers,
  getFriendRequests
} from "../controlers/friend.request.cotroler.js";

// import verifyJWT from "../middlewares/auth.middleware.js";
import verifyJWT from "../middleware/auth.middleware.js";

import { cancelFriendRequest } from "../controlers/friend.request.cotroler.js";

const friendRouter = express.Router();

// 🔍 Search users
friendRouter.get("/search", verifyJWT, searchUsers);

// 📩 Send friend request
friendRouter.post("/request/:receiverId", verifyJWT, sendFriendRequest);

// ✅ Accept request
friendRouter.post("/accept/:requestId", verifyJWT, acceptFriendRequest);

// ❌ Reject request
friendRouter.post("/reject/:requestId", verifyJWT, rejectFriendRequest);

// ❌ Cancel request (sender)
friendRouter.delete("/cancel/:requestId", verifyJWT, cancelFriendRequest);

//show friend requests
friendRouter.get("/requests", verifyJWT, getFriendRequests);

export default friendRouter;