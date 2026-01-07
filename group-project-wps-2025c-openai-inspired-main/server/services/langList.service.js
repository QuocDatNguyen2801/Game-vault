const ISO6391 = require("iso-639-1");

const getAllLanguages = () => {
  // Sort languages by their display name (A-Z)
  return ISO6391.getAllCodes()
    .map((code) => ({
      code,
      name: ISO6391.getName(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = {
  getAllLanguages,
};
