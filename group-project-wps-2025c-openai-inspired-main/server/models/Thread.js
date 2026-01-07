const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: false, trim: true },
    author: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    avatar: { type: String, default: "/img/default-avatar.png" },
    likedBy: { type: [String], default: [] }, // store userId as string
    likes: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true } // auto createdAt + updatedAt
);

module.exports = mongoose.model("Thread", threadSchema);
