const mongoose = require("mongoose");
const hashInput = require("../middlewares/hash").hashInput;

const qaSecuritySchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    securityQA: [qaSecuritySchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  try {
    //Hash password only if it is modified or new
    if (this.isModified("password")) {
      this.password = await hashInput(this.password);
    }
    // Hash security answers only if modified or new
    if (this.isModified("securityQA")) {
      for (const qa of this.securityQA) {
        if (qa.answer && !qa.answer.startsWith("$2b$")) {
          qa.answer = await hashInput(qa.answer);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = mongoose.model("User", userSchema);
