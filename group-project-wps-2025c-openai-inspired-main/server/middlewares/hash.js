const bcrypt = require('bcrypt');

const hashInput = async (plainInput) => {
    const hashedOutput = await bcrypt.hash(plainInput, 10);
    return hashedOutput;
};

module.exports = { hashInput };