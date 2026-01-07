const Post = require("../models/Post");

class PostService {
  async getPosts(filters = {}) {
    const { search, authorName, title, likedBy, from, to, sortBy } = filters;

    const clauses = [];

    if (search) {
      const regex = new RegExp(search, "i");
      clauses.push({
        $or: [{ title: regex }, { content: regex }, { authorName: regex }],
      });
    }

    if (authorName) {
      const regex = new RegExp(authorName, "i");
      clauses.push({ authorName: regex });
    }

    if (title) {
      const regex = new RegExp(title, "i");
      clauses.push({ title: regex });
    }

    if (likedBy) {
      clauses.push({ likedBy: String(likedBy) });
    }

    if (from || to) {
      const range = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(to);
      clauses.push({ createdAt: range });
    }

    const baseVisibility = { isHidden: { $ne: true } };
    const query = clauses.length ? { $and: [baseVisibility, ...clauses] } : baseVisibility;

    const posts = await Post.find(query).lean();
    const enriched = posts.map(this.withDerivedFields);

    const mode = (sortBy || "newest").toLowerCase();
    switch (mode) {
      case "oldest":
        return enriched.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
      case "most liked":
      case "most_liked":
      case "likes":
        return enriched.sort(
          (a, b) => Number(b.likes || 0) - Number(a.likes || 0)
        );
      case "newest":
      default:
        return enriched.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
  }

  async getPostById(id, options = {}) {
    const { includeHidden = false } = options;
    const visibility = includeHidden ? {} : { isHidden: { $ne: true } };
    const post = await Post.findOne({ _id: id, ...visibility }).lean();
    return post ? this.withDerivedFields(post) : null;
  }

  async createPost(data) {
    await Post.create(data);
  }

  //Features derived from likes (top 2)
  async getFeatures(filters = {}) {
    const posts = await this.getPosts(filters);
    return posts
      .slice()
      .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))
      .slice(0, 2);
  }

  withDerivedFields(post) {
    const content = post.content || "";
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readMins = Math.max(1, Math.ceil(wordCount / 200));
    const likedBy = Array.isArray(post.likedBy) ? post.likedBy.map(String) : [];
    const likes = likedBy.length;
    return {
      ...post,
      readMins,
      likes,
      likedBy,
    };
  }
  //Best of the week selection
  getBestOfTheWeek(posts) {
    if (!Array.isArray(posts) || posts.length === 0) return null;

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const withinWeek = posts.filter((p) => {
      const created = new Date(p.createdAt || 0).getTime();
      return isFinite(created) && now - created <= weekMs;
    });

    if (!withinWeek.length) return null;

    const likedWithinWeek = withinWeek.filter((p) => Number(p.likes || 0) > 0);
    if (!likedWithinWeek.length) return null;

    const best = likedWithinWeek.reduce((acc, p) => {
      const likes = Number(p.likes || 0);
      if (!acc || likes > Number(acc.likes || 0)) return p;
      return acc;
    }, null);

    return best ? this.withDerivedFields(best) : null;
  }

  //Like toggle
  async toggleLikeByUser(id, userId, likeFlag) {
    const post = await Post.findById(id);
    if (!post) return null;

    const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    const userKey = String(userId);
    const alreadyLiked = likedBy.includes(userKey);
    const targetLiked = likeFlag !== undefined ? !!likeFlag : !alreadyLiked;

    let nextLikedBy = likedBy;
    if (targetLiked && !alreadyLiked) {
      nextLikedBy = [...likedBy, userKey];
    } else if (!targetLiked && alreadyLiked) {
      nextLikedBy = likedBy.filter((u) => u !== userKey);
    }

    post.likedBy = nextLikedBy;
    post.likes = nextLikedBy.length;
    await post.save();
    return { likes: post.likes, liked: nextLikedBy.includes(userKey) };
  }

  async updatePost(id, updates = {}) {
    const allowed = ["title", "image", "content", "author"];
    const payload = {};
    allowed.forEach((k) => {
      if (
        Object.prototype.hasOwnProperty.call(updates, k) &&
        updates[k] !== undefined
      ) {
        payload[k] = updates[k];
      }
    });
    payload.updatedAt = new Date().toISOString();

    const updated = await Post.findByIdAndUpdate(id, payload, {
      new: true,
      lean: true,
    });
    return updated ? this.withDerivedFields(updated) : null;
  }

  async deletePost(id) {
    const res = await Post.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}

module.exports = PostService;
