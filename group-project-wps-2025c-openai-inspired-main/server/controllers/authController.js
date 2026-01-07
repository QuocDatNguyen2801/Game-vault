//NOTE: THIS FILE IS FOR AUTHENTICATION PURPOSES ONLY (SIGN IN, SIGN UP, PASSWORD RETRIEVAL)
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Profile = require("../models/Profile");
const Thread = require("../models/Thread");
const Reply = require("../models/Reply");
const Review = require("../models/Review");
const Post = require("../models/Post");

const { loadActiveQuestions } = require("../services/securityQuestion.service");
const { mergeGuestCartIntoUser } = require("../utils/mergeGuestCart");
const { updateGameRating } = require("../data/reviewStorage");

// Sign In Page
exports.getSignin = (req, res) => {
  res.render("Sign-in_Register/signin", {
    title: "Sign In",
    layout: "layouts/login_signup_main.ejs",
    next: req.query.next || "",
  });
};

exports.postSignin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.render("Sign-in_Register/signin", {
      title: "Sign In",
      layout: "layouts/login_signup_main.ejs",
      error: "Invalid email",
      next: req.query.next || req.body.next || "",
    });
  }
  if (user.isDeleted) {
    return res.render("Sign-in_Register/signin", {
      title: "Sign In",
      layout: "layouts/login_signup_main.ejs",
      error: "Account is deleted.",
      next: req.query.next || req.body.next || "",
    });
  }
  if (user.isLocked) {
    return res.redirect("/user/locked");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("Sign-in_Register/signin", {
      title: "Sign In",
      layout: "layouts/login_signup_main.ejs",
      error: "Invalid password",
      next: req.query.next || req.body.next || "",
    });
  }
  // Successful login: regenerate session to prevent fixation, then assign userId
  const next = req.query.next || req.body.next || "/";
  // Preserve guestCart before session regeneration
  const previousGuestCart = req.session.guestCart;
  req.session.regenerate(async (err) => {
    if (err) {
      return res.render("Sign-in_Register/signin", {
        title: "Sign In",
        layout: "layouts/login_signup_main.ejs",
        error: "Session error. Please try again.",
        next,
      });
    }
    // Reactivate if previously deactivated
    if (user.isDeactivated) {
      const impactedGames = await Review.find({ userId: user._id }).distinct(
        "gameTitle"
      );

      await User.updateOne(
        { _id: user._id },
        { $set: { isDeactivated: false } }
      );

      await Promise.all([
        Thread.updateMany({ userId: user._id }, { $set: { isHidden: false } }),
        Reply.updateMany({ authorId: user._id }, { $set: { isHidden: false } }),
        Review.updateMany({ userId: user._id }, { $set: { isHidden: false } }),
        Post.updateMany({ userId: user._id }, { $set: { isHidden: false } }),
      ]);

      await Promise.all(impactedGames.map((title) => updateGameRating(title)));
    }
    req.session.userId = user._id;
    // Restore guestCart to new session
    req.session.guestCart = previousGuestCart;
    // Merge guest cart into user cart
    await mergeGuestCartIntoUser(req, user._id);
    // Ensure session is persisted to the store before redirecting
    req.session.save((saveErr) => {
      if (saveErr) {
        return res.render("Sign-in_Register/signin", {
          title: "Sign In",
          layout: "layouts/login_signup_main.ejs",
          error: "Session save error. Please try again.",
          next,
        });
      }
      res.redirect(next);
    });
  });
};

// Sign Up Page
exports.getSignup = (req, res) => {
  req.session.tempUser = null;
  res.render("Sign-in_Register/signup", {
    title: "Sign Up",
    layout: "layouts/login_signup_main.ejs",
  });
};

exports.postSignup = async (req, res) => {
  const { username = "", email = "", password = "" } = req.body;
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedUsername || !normalizedEmail || !password) {
    return res.render("Sign-in_Register/signup", {
      title: "Sign Up",
      layout: "layouts/login_signup_main.ejs",
      error: "All fields are required",
    });
  }
  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });
  if (existingUser) {
    return res.render("Sign-in_Register/signup", {
      title: "Sign Up",
      layout: "layouts/login_signup_main.ejs",
      error: "Username or email already exists",
    });
  }
  req.session.tempUser = {
    username: normalizedUsername,
    email: normalizedEmail,
    password: password,
  };
  res.redirect("/user/signup/security");
};

// Sign Up Security Page
exports.getSignupSecurity = async (req, res) => {
  const tempUser = req.session.tempUser;
  const chosenQuestions = tempUser?.securityQA?.map((q) => q.question) || [];
  const allQuestions = (await loadActiveQuestions()).map((q) => q.question);
  const availableQuestions = allQuestions.filter(
    (q) => !chosenQuestions.includes(q)
  );
  res.render("Sign-in_Register/signup-security", {
    title: "Security Question",
    layout: "layouts/login_signup_main.ejs",
    availableQuestions,
    securityQA: tempUser?.securityQA || [],
  });
};

exports.postSignupSecurity = async (req, res) => {
  const { question, answer, action } = req.body;
  const tempUser = req.session.tempUser;
  if (!tempUser) {
    return res.redirect("/user/signup/security");
  }
  if (!tempUser.securityQA) {
    tempUser.securityQA = [];
  }
  const addSecurityQA = async (tempUser, question, answer) => {
    if (!tempUser.securityQA.some((q) => q.question === question)) {
      tempUser.securityQA.push({ question, answer: answer });
    }
  };
  if (action === "add") {
    await addSecurityQA(tempUser, question, answer);
    return exports.getSignupSecurity(req, res);
  }
  if (action === "signup") {
    await addSecurityQA(tempUser, question, answer);
    // Create new user in MongoDB
    const newUser = new User({
      ...tempUser,
      createdAt: new Date(),
      isDeleted: false,
      isDeactivated: false,
      deletedAt: null,
    });
    await newUser.save();
    // Create new profile
    const newProfile = new Profile({
      userId: newUser._id,
      avatar: "",
      fullName: "",
      nickName: "",
      gender: "",
      phoneNumber: "",
      country: "",
      language: "",
    });
    await newProfile.save();
    req.session.tempUser = null;
    // Auto-login after sign up
    const next = req.query.next || req.body.next || "/";
    req.session.regenerate(async (err) => {
      if (err) {
        return res.render("Sign-in_Register/signin", {
          title: "Sign In",
          layout: "layouts/login_signup_main.ejs",
          error: "Session error. Please try again.",
          next,
        });
      }
      req.session.userId = newUser._id;
      // Ensure session is persisted to the store before redirecting
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.render("Sign-in_Register/signin", {
            title: "Sign In",
            layout: "layouts/login_signup_main.ejs",
            error: "Session save error. Please try again.",
            next,
          });
        }
        res.redirect(next);
      });
    });
  }
};
// Password Retrieval Check Page
exports.getRetrievalCheck = (req, res) => {
  res.render("Sign-in_Register/retrieval-check", {
    title: "Security Check",
    layout: "layouts/login_signup_main.ejs",
    randomQA: null,
  });
};

exports.postRetrievalCheck = async (req, res) => {
  const { email, question, answer } = req.body;
  // Find user by email
  if (email && !question && !answer) {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.securityQA || user.securityQA.length === 0) {
      return res.render("Sign-in_Register/retrieval-check", {
        title: "Reset Password",
        layout: "layouts/login_signup_main.ejs",
        error: "User not found",
        randomQA: null,
      });
    }
    // Randomly select one security question
    const randomIndex = Math.floor(Math.random() * user.securityQA.length);
    const randomQA = user.securityQA[randomIndex];
    return res.render("Sign-in_Register/retrieval-check", {
      title: "Reset Password",
      layout: "layouts/login_signup_main.ejs",
      randomQA,
      email,
    });
  }
  // User submits answer to the question
  if (email && question && answer) {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.securityQA) {
      return res.render("Sign-in_Register/retrieval-check", {
        title: "Reset Password",
        layout: "layouts/login_signup_main.ejs",
        error: "User not found",
        randomQA: null,
      });
    }
    const qa = user.securityQA.find((qa) => qa.question === question);
    if (!qa || !(await bcrypt.compare(answer, qa.answer))) {
      const randomIndex = Math.floor(Math.random() * user.securityQA.length);
      const randomQA = user.securityQA[randomIndex];
      return res.render("Sign-in_Register/retrieval-check", {
        title: "Reset Password",
        layout: "layouts/login_signup_main.ejs",
        error: "Incorrect answer. Please try again.",
        email,
        randomQA,
      });
    }
    req.session.resetEmail = email;
    return res.redirect("/user/signin/reset-pass");
  }
  // Unexpected case
  return res.render("Sign-in_Register/retrieval-check", {
    title: "Reset Password",
    layout: "layouts/login_signup_main.ejs",
    error: "Invalid request. Please try again.",
    randomQA: null,
  });
};

// Reset Password Page (Only render when a session is set)
exports.getResetPass = (req, res) => {
  res.render("Sign-in_Register/reset-pass", {
    title: "Reset Password",
    layout: "layouts/login_signup_main.ejs",
  });
};

// Reset Password
exports.postResetPass = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const email = req.session.resetEmail;
  if (!email) {
    return res.render("Sign-in_Register/reset-pass", {
      title: "Reset Password",
      layout: "layouts/login_signup_main.ejs",
      error: "Reset session expired. Please restart password reset.",
    });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.render("Sign-in_Register/reset-pass", {
      title: "Reset Password",
      layout: "layouts/login_signup_main.ejs",
      error: "User not found",
    });
  }
  if (newPassword !== confirmPassword) {
    return res.render("Sign-in_Register/reset-pass", {
      title: "Reset Password",
      layout: "layouts/login_signup_main.ejs",
      error: "Passwords do not match",
    });
  }
  user.password = newPassword;
  await user.save();
  req.session.resetEmail = null;
  res.redirect("/user/signin");
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error while logging out:", err);
      return res.status(500).send("Error while logging out");
    }
    // Clear session cookie explicitly
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect("/");
  });
};

//NOTE: THE PART BELOW IS FOR SHOPPING CART MERGING FROM GUEST TO AUTHENTICATED USER

//  const Cart = require("../models/Cart");

// const mergeGuestCartIntoUser = (req, userId) => {
//   const guestItems = Array.isArray(req.session.guestCart)
//     ? req.session.guestCart
//     : [];
//   if (!guestItems.length) return;

//   const carts = Cart.findAll();
//   let cart = carts.find((c) => c.userId === userId);
//   if (!cart) {
//     cart = {
//       _id: Date.now().toString(),
//       userId,
//       items: [],
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     carts.push(cart);
//   }

//   guestItems.forEach((gi) => {
//     const existing = cart.items.find(
//       (i) => i.productId == gi.productId && i.edition == gi.edition
//     );
//     if (existing) existing.quantity += gi.quantity;
//     else cart.items.push({ ...gi });
//   });
//   cart.updatedAt = new Date();
//   writeCartData(carts);
//   req.session.guestCart = []; // clear after merge
// };
