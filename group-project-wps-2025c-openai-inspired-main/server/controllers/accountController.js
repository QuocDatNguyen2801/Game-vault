//THIS FILE IS FOR ACCOUNT MANAGEMENT PURPOSES ONLY (MY PROFILE, MY GAMES, SECURITY SETTINGS)
const styles = `<link rel="stylesheet" href="/css/login_signup.css" />`;
const scripts = `<script src="/js/account.js"></script>`;
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Profile = require("../models/Profile");
const Order = require("../models/Order");
const Thread = require("../models/Thread");
const Reply = require("../models/Reply");
const Review = require("../models/Review");
const Post = require("../models/Post");
const { getSafeAvatarPath } = require("../utils/avatarHelper");
const { loadActiveQuestions } = require("../services/securityQuestion.service");
const { getAllCountries } = require("../services/countryList.service");
const { getAllLanguages } = require("../services/langList.service");
const { getAllGenders } = require("../services/genderList.service");
const { updateGameRating } = require("../data/reviewStorage");

// Helper to format dates
/**
 * Formats a date string to DD/MM/YYYY format.
 * @param {string} dateString
 * @returns {string}
 */
function formatDateShort(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString || "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Helper to calculate time since signup
/**
 * Formats the time elapsed since the given ISO date string.
 * @param {string} isoDateString
 * @returns {string}
 */
function getTimeAgo(isoDateString) {
  if (!isoDateString) return "";
  const created = new Date(isoDateString);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    return months + (months === 1 ? " month ago" : " months ago");
  } else if (diffDays > 0) {
    return diffDays + (diffDays === 1 ? " day ago" : " days ago");
  } else {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) {
      return diffHours + (diffHours === 1 ? " hour ago" : " hours ago");
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0
        ? diffMinutes + (diffMinutes === 1 ? " minute ago" : " minutes ago")
        : "just now";
    }
  }
}

//Add avatar upload functionality
exports.uploadAvatar = async (req, res) => {
  const currentId = req.session.userId;
  // Ensure user is logged in
  if (!currentId) return res.redirect("/user/signin");

  // Ensure a file was provided
  if (!req.file) {
    return res.redirect("/account");
  }

  // Check if user exists in DB
  const currentUser = await User.findById(currentId);
  if (!currentUser) return res.redirect("/account");

  // Update profile avatar path
  await Profile.updateOne(
    { userId: currentId },
    { $set: { avatar: `/uploads/${req.file.filename}` } }
  );

  res.redirect("/account");
};

//MY PROFILE
exports.getMyProfile = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });

  // Check if user is logged in and profile exists
  if (!currentUser || !currentProfile) {
    return res.redirect("/user/signin");
  }

  // Calculate time since signup
  const emailTimeAgo = getTimeAgo(currentUser.createdAt);

  const genders = getAllGenders();
  let genderLabel = "";
  if (currentProfile.gender) {
    const found = genders.find((g) => g.value === currentProfile.gender);
    genderLabel = found ? found.label : currentProfile.gender;
  }

  const languages = getAllLanguages();
  let languageName = "";
  if (currentProfile.language) {
    const found = languages.find((l) => l.code === currentProfile.language);
    languageName = found ? found.name : currentProfile.language;
  }

  const countries = getAllCountries();
  let countryName = "";
  if (currentProfile.country) {
    const found = countries.find((c) => c.code === currentProfile.country);
    countryName = found ? found.name : currentProfile.country;
  }
  res.render("User-Profile/my-profile", {
    title: "My Profile",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    fullName: currentProfile.fullName || "",
    nickname: currentProfile.nickName || "",
    gender: currentProfile.gender || "",
    genderLabel,
    phoneNumber: currentProfile.phoneNumber || "",
    country: currentProfile.country || "",
    countryName,
    language: currentProfile.language || "",
    languageName,
    email: currentUser.email,
    username: currentUser.username || "",
    emailTimeAgo,
    styles,
    scripts,
    activePage: "profile",
  });
};

exports.getMyProfileEdit = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  // Check if user is logged in and profile exists
  if (!currentUser || !currentProfile) {
    return res.redirect("/user/signin");
  }
  const genders = getAllGenders();
  const countries = getAllCountries();
  const languages = getAllLanguages();
  const emailTimeAgo = getTimeAgo(currentUser.createdAt);
  res.render("User-Profile/my-profile-edit", {
    title: "My Profile",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    fullName: currentProfile.fullName || "",
    nickname: currentProfile.nickName || "",
    genders,
    gender: currentProfile.gender || "",
    phoneNumber: currentProfile.phoneNumber || "",
    countries,
    country: currentProfile.country || "",
    languages,
    language: currentProfile.language || "",
    email: currentUser.email,
    username: currentUser.username,
    emailTimeAgo,
    styles,
    scripts,
    activePage: "profile",
  });
};

exports.postMyProfileEdit = async (req, res) => {
  const currentId = req.session.userId;
  // Check if user is logged in first by checking id in session
  if (!currentId) return res.redirect("/user/signin");
  //Use updateOne directly without loading all profiles
  await Profile.updateOne(
    { userId: currentId },
    {
      $set: {
        fullName: req.body.fullName,
        nickName: req.body.nickname,
        gender: req.body.gender,
        phoneNumber: req.body.phoneNumber,
        country: req.body.country,
        language: req.body.language,
      },
    }
  );
  res.redirect("/account");
};

//MY GAMES
const getMyGamesError = async (req, res, errorMessage) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  res.render("User-Profile/my-games", {
    title: "My Games",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    games: [],
    username: currentUser?.username || "",
    error: errorMessage,
    styles,
    scripts,
    activePage: "my-games",
  });
};

exports.getMyGames = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  const orders = await Order.find({ userId: currentId }).lean();

  // Aggregate games by title+edition
  const gameMap = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.title + "||" + item.edition; // Unique key to distinguish game across editions
      if (!gameMap.has(key)) {
        //Initialize new entry
        gameMap.set(key, {
          name: item.title,
          edition: item.edition,
          image: item.image,
          quantity: item.quantity,
          paidDate: order.createdAt,
        });
      } else {
        const game = gameMap.get(key);
        // Update quantity if same title+edition found in another order
        game.quantity += item.quantity;
        // Always keep the latest (newest) paidDate
        if (new Date(order.createdAt) > new Date(game.paidDate)) {
          game.paidDate = order.createdAt;
        }
      }
    });
  });

  const games = Array.from(gameMap.values()).map((game) => ({
    ...game,
    paidDate: formatDateShort(game.paidDate),
  }));

  if (games.length === 0) {
    return getMyGamesError(req, res, "You have not purchased any games yet.");
  }

  res.render("User-Profile/my-games", {
    title: "My Games",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    games,
    username: currentUser?.username,
    styles,
    scripts,
    activePage: "my-games",
  });
};
// Strip hashed answers before rendering forms function
const sanitizeSecurityQA = (securityQA = []) =>
  securityQA.map((qa) => ({ question: qa.question, answer: "" }));

//HELPER FUNCTION FOR SECURITY EDIT ERROR RENDERING
const getSecurityEditError = async (req, res, errorMessage) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  if (!currentUser || !currentProfile) {
    return res.redirect("/user/signin");
  }
  const chosenQuestions = (currentUser.securityQA || []).map(
    (qa) => qa.question
  );
  const allQuestions = (await loadActiveQuestions()).map((q) => q.question);
  const availableQuestions = allQuestions.filter(
    (q) => !chosenQuestions.includes(q)
  );
  res.render("User-Profile/security-settings-edit", {
    title: "Security Settings",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    username: currentUser.username || "",
    password: "",
    securityQA: sanitizeSecurityQA(currentUser.securityQA),
    availableQuestions,
    error: errorMessage,
    styles,
    scripts,
    activePage: "security",
  });
};

exports.getSecurity = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  res.render("User-Profile/security-settings", {
    title: "Security Settings",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    username: currentUser?.username || "",
    password: "",
    securityQA: sanitizeSecurityQA(currentUser?.securityQA),
    styles,
    scripts,
    activePage: "security",
  });
};

exports.getSecurityEdit = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);
  const currentProfile = await Profile.findOne({ userId: currentId });
  const chosenQuestions = (currentUser.securityQA || []).map(
    (qa) => qa.question
  );
  const allQuestions = (await loadActiveQuestions()).map((q) => q.question);
  const availableQuestions = allQuestions.filter(
    (q) => !chosenQuestions.includes(q)
  );
  res.render("User-Profile/security-settings-edit", {
    title: "Security Settings",
    layout: "layouts/main.ejs",
    avatar: getSafeAvatarPath(currentProfile.avatar),
    username: currentUser?.username || "",
    password: "",
    securityQA: sanitizeSecurityQA(currentUser?.securityQA),
    availableQuestions,
    styles,
    scripts,
    activePage: "security",
  });
};

exports.postSecurityEdit = async (req, res) => {
  const currentId = req.session.userId;
  const currentUser = await User.findById(currentId);

  const currentPassword = req.body["current-password"];
  const newPassword = req.body["new-password"];
  const confirmPassword = req.body["confirm-password"];

  if (!currentUser) return res.redirect("/account");

  //Only proceed if current password is filled
  if (currentPassword.trim() !== "") {
    //Check for current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser.password
    );
    if (!isCurrentPasswordValid) {
      return getSecurityEditError(req, res, "Your password is incorrect.");
    }

    //Check for new/confirm password empty
    if (newPassword.trim() === "" || confirmPassword.trim() === "") {
      return getSecurityEditError(
        req,
        res,
        "New password and confirm password cannot be empty."
      );
    }

    //Check for current and new password duplicate
    const isSameAsCurrent = await bcrypt.compare(
      newPassword,
      currentUser.password
    );
    if (isSameAsCurrent) {
      return getSecurityEditError(
        req,
        res,
        "New password must be different from current password."
      );
    }

    //Check for new password and confirm password match
    if (newPassword !== confirmPassword) {
      return getSecurityEditError(
        req,
        res,
        "New password and confirm password do not match."
      );
    }
    //If all checks pass, proceed to update password
    currentUser.password = newPassword;
  }

  // username change handling
  const newUsername = req.body.username.trim();
  if (newUsername === "") {
    return getSecurityEditError(req, res, "Username cannot be empty.");
  }
  if (newUsername !== currentUser.username) {
    // Check if new username is already taken
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return getSecurityEditError(
        req,
        res,
        "Username is already taken. Please choose another."
      );
    }
    currentUser.username = newUsername;
  }

  // Handle dynamic security questions and answers
  let updatingQuestions = req.body.securityQuestion;
  let updatingAnswers = req.body.securityAnswer;
  const currentSecurityQA = currentUser.securityQA || [];

  // Ensure they are arrays
  if (!Array.isArray(updatingQuestions))
    updatingQuestions = [updatingQuestions];
  if (!Array.isArray(updatingAnswers)) updatingAnswers = [updatingAnswers];

  const uniqueQuestions = new Set(updatingQuestions); // Filter out duplicate values
  if (uniqueQuestions.size !== updatingQuestions.length) {
    return getSecurityEditError(
      req,
      res,
      "Security questions must not be duplicated."
    );
  }

  // Build securityQA array; preserve existing hashed answers when left blank
  const securityQA = [];
  for (let i = 0; i < updatingQuestions.length; i += 1) {
    const question = updatingQuestions[i];
    const incomingAnswer = updatingAnswers[i];
    const hasAnswer = incomingAnswer && incomingAnswer.trim() !== "";
    const previous = currentSecurityQA[i];

    if (!hasAnswer) {
      if (previous && previous.question === question) {
        securityQA.push({ question, answer: previous.answer });
        continue;
      }
      return getSecurityEditError(req, res, "Security answer cannot be empty.");
    }
    securityQA.push({ question, answer: incomingAnswer });
  }

  currentUser.securityQA = securityQA;
  await currentUser.save();

  // Redirect to security settings page after edit
  res.redirect("/account/security");
};

// Delete account: remove user and profile, then end session
exports.deleteAccount = async (req, res) => {
  const currentId = req.session.userId;
  if (!currentId) return res.redirect("/user/signin");

  try {
    const userReviews = await Review.find({ userId: currentId }).select(
      "gameTitle"
    );
    const impactedGames = Array.from(
      new Set(userReviews.map((r) => r.gameTitle).filter(Boolean))
    );

    const timestamp = Date.now();
    const anonValue = `deleted-${timestamp}`;
    const hashed = await bcrypt.hash(anonValue, 10);

    await Promise.all([
      User.updateOne(
        { _id: currentId },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            username: anonValue,
            email: `${anonValue}@deleted.local`,
            password: hashed,
            securityQA: [],
          },
        }
      ),
      Profile.updateOne(
        { userId: currentId },
        {
          $set: {
            avatar: "",
            fullName: "",
            nickName: "",
            gender: "",
            phoneNumber: "",
            country: "",
            language: "",
          },
        }
      ),
      Thread.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
      Reply.updateMany({ authorId: currentId }, { $set: { isHidden: true } }),
      Review.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
      Post.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
    ]);

    await Promise.all(impactedGames.map((title) => updateGameRating(title)));

    req.session.destroy(() => {
      res.redirect("/user/signin");
    });
  } catch (err) {
    console.error("Error deleting account", err);
    res.redirect("/account/security");
  }
};

// Deactivate account: mark user as deactivated and end session
exports.deactivateAccount = async (req, res) => {
  const currentId = req.session.userId;
  if (!currentId) return res.redirect("/user/signin");

  try {
    // Collect affected game titles before hiding reviews so ratings can be recalculated
    const userReviews = await Review.find({ userId: currentId }).select(
      "gameTitle"
    );
    const impactedGames = Array.from(
      new Set(userReviews.map((r) => r.gameTitle).filter(Boolean))
    );

    await User.updateOne(
      { _id: currentId },
      {
        $set: {
          isDeactivated: true,
        },
      }
    );

    await Promise.all([
      Thread.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
      Reply.updateMany({ authorId: currentId }, { $set: { isHidden: true } }),
      Review.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
      Post.updateMany({ userId: currentId }, { $set: { isHidden: true } }),
    ]);

    // Refresh ratings for games the user reviewed so hidden reviews are removed from averages
    await Promise.all(impactedGames.map((title) => updateGameRating(title)));

    req.session.destroy(() => {
      res.redirect("/user/signin");
    });
  } catch (err) {
    console.error("Error deactivating account", err);
    res.redirect("/account/security");
  }
};
