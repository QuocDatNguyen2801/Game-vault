const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      default: "",
    },
    nickName: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
 module.exports = mongoose.model("Profile", profileSchema);

