const countryList = require("country-list");

const getAllCountries = () => {
  return countryList.getData();
};

module.exports = {
  getAllCountries,
};