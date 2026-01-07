const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    // references Thread._id (Mongo ObjectId)
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },

    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },

    // soft-hide reply when author deactivates
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reply", replySchema);
