// To ensure there is a reset session, we check if the session contains a resetEmail.
exports.requireResetSession = (req, res, next) => {
  if (!req.session.resetEmail) {
    return res.redirect("/user/signin");
  }
  next();
};

// Middleware to check if the user is signed in
const User = require("../models/User");

exports.requireSignin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/user/signin");
  }

  const user = await User.findById(req.session.userId).lean();
  if (!user || user.isDeleted || user.isDeactivated) {
    req.session.destroy(() => {
      res.redirect("/user/signin");
    });
    return;
  }
  if (user.isLocked) {
    return res.redirect("/user/locked");
  }
  next();
};

exports.requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(403).render("errors/403", {
      layout: "layouts/main",
      title: "Access denied",
    });
  }
  const user = await User.findById(req.session.userId).lean();
  if (
    !user ||
    user.isDeleted ||
    user.isDeactivated ||
    user.isLocked ||
    !user.isAdmin
  ) {
    return res.status(403).render("errors/403", {
      layout: "layouts/main",
      title: "Access denied",
    });
  }
  next();
};
