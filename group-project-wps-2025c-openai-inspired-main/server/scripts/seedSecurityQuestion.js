const { connectDB, connectDBTest } = require("../config/db");
const securityQuestions = require("../models/securityQuestions");

const questions = [
    { question: "What is your favorite color?" },
    { question: "What is your favorite food?" },
    { question: "What is your favorite movie?" },
    { question: "What is your mother's first name?" },
    { question: "What is the name of your best friend?" },
    { question: "What was the name of your first pet?" },
    { question: "What city were you born in?" }
];

const run = async () => {
    try {
        // await connectDB();
        await connectDBTest();

        await securityQuestions.insertMany(questions);
        console.log("Seed security questions completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Seed Error: ", err);
        process.exit(1);
    }
};

run();