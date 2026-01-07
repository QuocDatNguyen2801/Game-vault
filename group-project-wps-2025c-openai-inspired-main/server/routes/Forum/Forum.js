// routes/Forum.js
const express = require("express");
const router = express.Router();

const forumController = require('../../controllers/forumController');
const { requireSignin } = require('../../middlewares/authMiddleware');



// ---------------------------
// GET /forum – list threads
// ---------------------------
router.get("/", forumController.getForumList);

// ---------------------------
// POST /forum/create – new thread
// ---------------------------
router.post("/create", requireSignin, forumController.createThread);

// POST: /forum/like/:id – toggle like
router.post("/like/:id", requireSignin, forumController.toggleLike);

// Replies
router.get("/:id/replies", forumController.getReplies);
router.post("/:id/replies", requireSignin, forumController.createReply);


// ---------------------------
// DELETE /forum/delete/:id – delete thread
// ---------------------------
router.delete("/delete/:id", requireSignin, forumController.deleteThread);

module.exports = router;


