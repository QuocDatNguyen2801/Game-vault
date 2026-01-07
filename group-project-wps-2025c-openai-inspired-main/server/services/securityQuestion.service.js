const SecurityQuestions = require("../models/securityQuestions");

async function loadActiveQuestions() {
  return SecurityQuestions.find({ isActive: true })
    .sort({ question: 1 })
    .lean();
}

module.exports = {
  loadActiveQuestions,
};
