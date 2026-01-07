const { genderOptions } = require("gender-options");

// console.log(genderOptions);
const getAllGenders = () => {
  return genderOptions.basic;
};

module.exports = {
  getAllGenders,
};