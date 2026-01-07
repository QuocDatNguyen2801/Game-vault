const mongoose = require('mongoose');

const securityQuestionsSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const SecurityQuestion = mongoose.model('SecurityQuestion', securityQuestionsSchema);
module.exports = SecurityQuestion;