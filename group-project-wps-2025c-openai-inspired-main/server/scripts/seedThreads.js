require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Thread = require("../models/Thread");
const { connectDB, connectDBTest } = require("../config/db");

(async function run() {
  try {
    await connectDBTest();
    // await connectDB();

    const threadsPath = path.join(__dirname, "..", "data", "threads.json");
    if (!fs.existsSync(threadsPath)) {
      throw new Error(`Missing seed file: ${threadsPath}`);
    }

    const raw = fs.readFileSync(threadsPath, "utf8");
    const threads = JSON.parse(raw);

    const normalized = threads.map((t) => {
      const likedBy = Array.isArray(t.likedBy) ? t.likedBy.map(String) : [];
      const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
      return {
        userId: new mongoose.Types.ObjectId(t.userId),
        title: t.title,
        slug: t.slug,
        author: t.author,
        content: t.content,
        avatar: t.avatar || "/img/default-avatar.png",
        likedBy,
        likes: typeof t.likes === "number" ? t.likes : likedBy.length,
        createdAt,
      };
    });

    await Thread.deleteMany({});
    const inserted = await Thread.insertMany(normalized, { ordered: true });
    console.log(`Seeded threads: ${inserted.length}`);
  } catch (err) {
    console.error("Thread seeding failed:", err);
    process.exit(1);
  }

  await mongoose.disconnect();
  process.exit(0);
})();
