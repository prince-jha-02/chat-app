import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    
  },
  { timestamps: true }
);

//preven self request
friendRequestSchema.pre("save", function (next) {
  if (this.sender.toString() === this.receiver.toString()) {
    return next(new Error("Cannot send request to yourself"));
  }
  
});

//  Prevent duplicate requests (important)
friendRequestSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;