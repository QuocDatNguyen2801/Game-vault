const Thread = require("../models/Thread");
const Reply = require("../models/Reply");
const Profile = require("../models/Profile");
const User = require("../models/User");
const slugify = require("../utils/slugify");

const styles = [`<link rel="stylesheet" href="/css/forum.css">`];
const scripts = [
  `<script src="/js/forum.js"></script>`,
  `<script src="/js/replies-modal.js"></script>`,
];

async function getAvatarForUser(userId) {
  const profile = await Profile.findOne({ userId: userId }).lean();
  if (profile && profile.avatar && profile.avatar !== "") return profile.avatar;
  return "/img/default-avatar.png";
}

async function buildUniqueSlug(title) {
  const base = slugify(title || "");
  const fallback = base || "thread";
  let candidate = fallback;
  let suffix = 1;
  while (await Thread.exists({ slug: candidate })) {
    candidate = `${fallback}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

// GET /forum

exports.getForumList = async (req, res) => Thread.find({ isHidden: { $ne: true } })
  .sort({ createdAt: -1 })
  .lean()
  .then(async (threads) => {
  try {
    const currentUserId = req.session?.userId ? String(req.session.userId) : null;

    const enriched = await Promise.all(
      threads.map(async (t) => {
        const repliesCount = await Reply.countDocuments({
          threadId: t._id,
          isHidden: { $ne: true },
        });
        
        const liked = currentUserId
          ? (t.likedBy || []).map(String).includes(currentUserId)
          : false;

        return {
          ...t,
          replies: repliesCount,
          avatar: await getAvatarForUser(t.authorId || t.userId),
          liked,
        };
      })
    );

    res.render("forum/index", {
      layout: "layouts/main",
      title: "Discussion Forum",
      threads: enriched,
      styles,
      scripts,
      isSignedIn: !!currentUserId,
      currentUserId,
    });
  } catch (err) {
    console.error("getForumList error:", err);
    res.status(500).send("Server error loading forum");
  }
}).catch((err) => {
  console.error("getForumList error:", err);
  res.status(500).send("Server error loading forum");
});

// POST /forum/create
exports.createThread = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.session?.userId;

    const user = await User.findById(userId).lean();
    const author = user?.username || "Unknown (Legacy)";

    if (!title || !author || !content) return res.redirect("/forum");

    
    const avatar = await getAvatarForUser(userId);
    const slug = await buildUniqueSlug(title.trim());
    await Thread.create({
      userId,
      title: title.trim(),
      slug,
      author,
      content: content.trim(),
      avatar,
      likedBy: [],
      likes: 0,
    });

    res.redirect("/forum");
  } catch (err) {
    console.error("createThread error:", err);
    res.status(500).send("Server error creating thread");
  }
};

// POST /forum/like/:id
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.session?.userId ? String(req.session.userId) : null;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const threadId = req.params.id;

    const thread = await Thread.findById(threadId);
    if (!thread || thread.isHidden) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const likedBy = Array.isArray(thread.likedBy) ? thread.likedBy.map(String) : [];
    const already = likedBy.includes(userId);

    thread.likedBy = already
      ? likedBy.filter((uid) => uid !== userId)
      : [...likedBy, userId];

    thread.likes = thread.likedBy.length;

    await thread.save();

    res.json({ likes: thread.likes, liked: !already });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /forum/delete/:id
exports.deleteThread = async (req, res) => {
  try {
    const requesterId = String(req.session?.userId || "");
    const threadId = req.params.id;

    const thread = await Thread.findById(threadId).lean();
    if (!thread) return res.status(404).json({ success: false, error: "Thread not found" });

    // ownership check (same as you had)
    if (requesterId && String(thread.userId || "") !== requesterId) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await Thread.findByIdAndDelete(threadId);
    await Reply.deleteMany({ threadId });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteThread error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET /forum/:id/replies
exports.getReplies = async (req, res) => {
  try {
    const threadId = req.params.id;

    const thread = await Thread.findById(threadId).lean();
    if (!thread || thread.isHidden) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const list = await Reply.find({
      threadId,
      isHidden: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      replies: await Promise.all(
        list.map(async (r) => ({
          ...r,
          avatar: await getAvatarForUser(r.authorId),
        }))
      ),
    });
  } catch (err) {
    console.error("getReplies error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /forum/:id/replies
exports.createReply = async (req, res) => {
  try {
    const threadId = req.params.id;
    const { content } = req.body || {};

    const userId = req.session?.userId;
    const user = await User.findById(userId).lean();
    const author = user?.username || "Unknown (Legacy)";

    if (!content) return res.status(400).json({ error: "Content is required" });
    if (!author) return res.status(401).json({ error: "Login required" });

    const thread = await Thread.findById(threadId).lean();
    if (!thread || thread.isHidden) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const created = await Reply.create({
      threadId,
      authorId: userId,
      author,
      content: content.trim(),
    });

    const replyCount = await Reply.countDocuments({
      threadId,
      isHidden: { $ne: true },
    });

    
    res.json({
      reply: { ...created.toObject(), avatar: await getAvatarForUser(userId) },
      replies: replyCount,
    });
  } catch (err) {
    console.error("createReply error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
