import FriendRequest from "../models/friend.model.js";
import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const sendFriendRequest = async (req, res) => {
    const senderId = req.user._id;
    const receiverId = req.params.receiverId;

    // ❌ prevent self request
    if (senderId.toString() === receiverId) {
        throw new ApiError(400, "You cannot send request to yourself");
    }

    // ❌ check already friends
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
        throw new ApiError(400, "Already friends");
    }

    // ❌ check existing request (both directions)
    const existing = await FriendRequest.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ],
        status: "pending"
    });

    if (existing) {
        throw new ApiError(400, "Request already exists");
    }

    // ✅ create request
    const request = await FriendRequest.create({
        sender: senderId,
        receiver: receiverId
    });

    res.status(201).json({
        success: true,
        request
    });
};

const acceptFriendRequest = async (req, res) => {
    const userId = req.user._id; // logged-in user
    const requestId = req.params.requestId;

    // 🔍 find request
    const request = await FriendRequest.findById(requestId);

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // ❌ only receiver can accept
    if (request.receiver.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to accept this request");
    }

    // ❌ already handled
    if (request.status !== "pending") {
        throw new ApiError(400, "Request already handled");
    }

    // ✅ update request status
    request.status = "accepted";
    await request.save();

    // ✅ add both users to each other's friend list
    await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver }
    });

    await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender }
    });

    return res.status(200).json({
        success: true,
        message: "Friend request accepted"
    });
};

const cancelFriendRequest = async (req, res) => {
    const userId = req.user._id;
    const requestId = req.params.requestId;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // ❌ only sender can cancel
    if (request.sender.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to cancel this request");
    }

    // ❌ only pending requests can be cancelled
    if (request.status !== "pending") {
        throw new ApiError(400, "Cannot cancel this request");
    }

    await request.deleteOne();

    return res.json({
        success: true,
        message: "Friend request cancelled"
    });
};


const rejectFriendRequest = async (req, res) => {
    const userId = req.user._id;
    const requestId = req.params.requestId;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // ❌ only receiver can reject
    if (request.receiver.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to reject this request");
    }

    if (request.status !== "pending") {
        throw new ApiError(400, "Request already handled");
    }

    request.status = "rejected";
    await request.save();

    return res.json({
        success: true,
        message: "Friend request rejected"
    });
};



const searchUsers = async (req, res) => {
    const userId = req.user._id;
    const query = req.query.query;

    if (!query) {
        return res.json({ success: true, users: [] });
    }

    // 🔍 search all users (except self)
    const users = await User.find({
        userName: { $regex: query, $options: "i" },
        _id: { $ne: userId }
    }).select("userName profilePic");

    // 👤 current user friends
    const currentUser = await User.findById(userId).select("friends");

    const friendSet = new Set(
        currentUser.friends.map(id => id.toString())
    );

    // 📩 all related requests
    const requests = await FriendRequest.find({
        $or: [
            { sender: userId },
            { receiver: userId }
        ]
    });

    // build request maps
    const sentMap = new Set();
    const receivedMap = new Set();

    requests.forEach(r => {
        if (r.sender.toString() === userId.toString()) {
            sentMap.add(r.receiver.toString());
        } else {
            receivedMap.add(r.sender.toString());
        }
    });

    // 🧠 attach status
    const result = users.map(user => {
        let status = "none";

        if (friendSet.has(user._id.toString())) {
            status = "friend";
        } else if (sentMap.has(user._id.toString())) {
            status = "requested";
        } else if (receivedMap.has(user._id.toString())) {
            status = "pending";
        }

        return {
            _id: user._id,
            userName: user.userName,
            profilePic: user.profilePic,
            status
        };
    });

    return res.json({
        success: true,
        users: result
    });
};


const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: "pending"
    })
    .populate("sender", "name email") // optional but IMPORTANT
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export {sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    rejectFriendRequest,
    searchUsers,
    getFriendRequests
}


