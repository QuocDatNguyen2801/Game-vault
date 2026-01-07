require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const { connectDBTest, connectDB } = require("../config/db");

async function run() {
  // Uncomment either line below to choose the database
  // await connectDB();
  await connectDBTest();

  const postsPath = path.join(__dirname, "..", "data", "posts.json");
  if (!fs.existsSync(postsPath)) {
    throw new Error(`Missing seed file: ${postsPath}`);
  }

  const raw = fs.readFileSync(postsPath, "utf8");
  const posts = JSON.parse(raw);

  // Normalize fields to match schema expectations
  const normalized = posts.map((p) => {
    const likedBy = Array.isArray(p.likedBy) ? p.likedBy.map(String) : [];
    return {
      _id: String(p._id || p.id || Date.now()),
      id: p.id ? String(p.id) : undefined,
      title: p.title,
      image: p.image,
      content: p.content,
      authorID:
        p.authorID || p.authorId ? String(p.authorID || p.authorId) : undefined,
      authorId: p.authorId ? String(p.authorId) : undefined,
      userID: p.userID || p.userId ? String(p.userID || p.userId) : undefined,
      userId: p.userId ? String(p.userId) : undefined,
      authorName: p.authorName,
      likedBy,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      readMins: p.readMins,
      likes: likedBy.length,
    };
  });

  await Post.deleteMany({});
  const inserted = await Post.insertMany(normalized, { ordered: true });
  console.log(`Seeded posts: ${inserted.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
