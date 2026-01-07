const mongoose = require("mongoose");
const PostService = require("../services/blogServices");
const User = require("../models/User");
const Profile = require("../models/Profile");
const { Types } = require("mongoose");
const DEFAULT_AVATAR = "/img/default-avatar.png";
const DEFAULT_BLOG_IMAGE = "/img/default-placeholder-blog.png";
const scripts = [
  //   `<script src="/js/Blog/blog-admin.js" ></script>`,
  //   `<script src="/js/Blog/blog-search.js" ></script>`,
  //   `<script src="/js/Blog/blog-sort.js" ></script>`,
  //   `<script src="/js/Blog/like-count.js" ></script>`,
];
const styles = `<link rel="stylesheet" href="/css/blog.css" />`;

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(String(id || ""));

function normalizeParagraphs(raw) {
  const normalized = (raw || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\r\n/g, "\n");
  return normalized.split(/\n+/).filter(Boolean);
}

async function loadUserInfoMap(userIds = []) {
  const ids = Array.from(new Set(userIds.filter(Boolean).map(String)));
  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!objectIds.length) return { names: new Map(), avatars: new Map() };

  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: objectIds } })
      .select("_id username")
      .lean(),
    Profile.find({ userId: { $in: objectIds } })
      .select("userId avatar")
      .lean(),
  ]);

  const names = new Map();
  const avatars = new Map();
  users.forEach((u) => names.set(String(u._id), u.username));
  profiles.forEach((p) => {
    if (p.avatar && p.avatar.trim() !== "") {
      avatars.set(String(p.userId), p.avatar);
    }
  });

  return { names, avatars };
}

function resolveImage(img) {
  const trimmed = typeof img === "string" ? img.trim() : "";
  return trimmed ? trimmed : DEFAULT_BLOG_IMAGE;
}

class BlogController {
  constructor() {
    this.service = new PostService();
  }

  async getAllPosts(req, res) {
    try {
      const { q, search, authorName, title, likedBy, from, to, sortBy } =
        req.query || {};
      const filters = {
        search: q || search || undefined,
        authorName: authorName || undefined,
        title: title || undefined,
        likedBy: likedBy || undefined,
        from: from || undefined,
        to: to || undefined,
        sortBy: sortBy || undefined,
      };

      const posts = await this.service.getPosts(filters);
      const features = await this.service.getFeatures(filters);
      const bestOfWeek = this.service.getBestOfTheWeek(posts);
      const allSourceIds = [
        ...posts.map((p) => p.userId || p.authorId),
        ...features.map((p) => p.userId || p.authorId),
        bestOfWeek ? [bestOfWeek.userId || bestOfWeek.authorId] : [],
      ].flat();
      const { names, avatars } = await loadUserInfoMap(allSourceIds);
      const isSignedIn = !!req.session?.userId;
      const currentUserId = req.session?.userId || null;
      const resolveAvatar = (storedAvatar, profileAvatar) => {
        const cleanStored =
          storedAvatar &&
          storedAvatar.trim() !== "" &&
          storedAvatar !== DEFAULT_AVATAR
            ? storedAvatar
            : null;
        const cleanProfile =
          profileAvatar && profileAvatar.trim() !== "" ? profileAvatar : null;
        return cleanStored || cleanProfile || DEFAULT_AVATAR;
      };
      const decorate = (p) => {
        const sourceId = p.userId || p.authorId;
        const nameFromDb = names.get(String(sourceId));
        const avatarFromDb = avatars.get(String(sourceId));
        const authorName = p.authorName || nameFromDb || "Anonymous";
        const liked = currentUserId
          ? Array.isArray(p.likedBy) &&
            p.likedBy.map(String).includes(String(currentUserId))
          : false;
        return {
          ...p,
          authorName,
          avatar: resolveAvatar(p.avatar, avatarFromDb),
          image: resolveImage(p.image),
          liked,
        };
      };
      const decoratedPosts = posts.map(decorate);
      const decoratedFeatures = features.map(decorate);
      const decoratedBest = bestOfWeek ? decorate(bestOfWeek) : null;
      res.render("blog/blog", {
        title: "Blog",
        posts: decoratedPosts,
        features: decoratedFeatures,
        bestOfWeek: decoratedBest,
        isSignedIn,
        currentUserId,
        styles,
        scripts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching posts");
    }
  }

  async getPostById(req, res) {
    try {
      const post = await this.service.getPostById(req.params.id);
      if (!post) {
        const hiddenPost = await this.service.getPostById(req.params.id, {
          includeHidden: true,
        });
        if (hiddenPost?.isHidden) {
          const hiddenSourceId = hiddenPost.userId || hiddenPost.authorId;
          const dbUser = isValidObjectId(hiddenSourceId)
            ? await User.findById(hiddenSourceId)
            : null;
          const userDeleted = !dbUser || dbUser.isDeleted;
          if (!userDeleted) {
            return res.status(404).send("Post not found");
          }

          const placeholderContent = "The content is no longer available";
          const decoratedDeleted = {
            ...hiddenPost,
            authorName: "Deleted account",
            avatar: DEFAULT_AVATAR,
            image: DEFAULT_BLOG_IMAGE,
            heroStyle: `background-image: url('${DEFAULT_BLOG_IMAGE}')`,
            hasImage: true,
            liked: false,
            likedBy: [],
            likes: 0,
            content: placeholderContent,
            paragraphs: [placeholderContent],
          };

          return res.render("blog/blog-detail", {
            title: decoratedDeleted.title || "Blog",
            post: decoratedDeleted,
            isSignedIn: !!req.session?.userId,
            currentUserId: req.session?.userId || null,
            styles,
            scripts,
          });
        }
        return res.status(404).send("Post not found");
      }
      const isSignedIn = !!req.session?.userId;
      const currentUserId = req.session?.userId || null;
      const sourceId = post.userId || post.authorId;
      const canLookup = isValidObjectId(sourceId);
      const [userDoc, profileDoc] = canLookup
        ? await Promise.all([
            User.findById(sourceId).select("username isDeleted").lean(),
            Profile.findOne({ userId: sourceId }).select("avatar").lean(),
          ])
        : [null, null];
      const authorName = post.authorName || userDoc?.username || "Anonymous";
      const resolvedImage = resolveImage(post.image);
      const hasCustomImage = resolvedImage !== DEFAULT_BLOG_IMAGE;
      const resolveAvatar = (storedAvatar, profileAvt) => {
        const cleanStored =
          storedAvatar &&
          storedAvatar.trim() !== "" &&
          storedAvatar !== DEFAULT_AVATAR
            ? storedAvatar
            : null;
        const cleanProfile =
          profileAvt && profileAvt.trim() !== "" ? profileAvt : null;
        return cleanStored || cleanProfile || DEFAULT_AVATAR;
      };
      const decoratedPost = {
        ...post,
        authorName,
        avatar: resolveAvatar(post.avatar, profileDoc?.avatar),
        image: hasCustomImage ? resolvedImage : null,
        heroStyle: hasCustomImage
          ? `background-image: url('${resolvedImage}')`
          : "",
        hasImage: hasCustomImage,
        liked:
          currentUserId && Array.isArray(post.likedBy)
            ? post.likedBy.map(String).includes(String(currentUserId))
            : false,
        paragraphs: normalizeParagraphs(post.content),
      };
      res.render("blog/blog-detail", {
        title: post.title,
        post: decoratedPost,
        isSignedIn,
        currentUserId,
        styles,
        scripts,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching post");
    }
  }

  async createPost(req, res) {
    try {
      if (!req.session?.userId) {
        return res.redirect("/user/signin?next=/blog");
      }
      const { title, image, content } = req.body;
      const userId = req.session.userId;
      const [userDoc, profileDoc] = await Promise.all([
        User.findById(userId).select("username").lean(),
        Profile.findOne({ userId }).select("avatar").lean(),
      ]);
      const authorName = userDoc?.username || "Anonymous";
      const avatar = profileDoc?.avatar || DEFAULT_AVATAR;
      const uploadedImage = req.file
        ? `/uploads/${req.file.filename}`
        : undefined;
      const resolvedImage = resolveImage(uploadedImage || image);
      const newPost = {
        _id: Date.now().toString(),
        title,
        image: resolvedImage,
        content,
        authorId: userId,
        userId,
        authorName,
        avatar,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };
      await this.service.createPost(newPost);
      res.redirect("/blog");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating post");
    }
  }

  async likePost(req, res) {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const result = await this.service.toggleLikeByUser(
        req.params.id,
        userId,
        true
      );
      if (result == null)
        return res.status(404).json({ error: "Post not found" });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error liking post" });
    }
  }

  async toggleLike(req, res) {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { like } = req.body || {};
      const result = await this.service.toggleLikeByUser(
        req.params.id,
        userId,
        like
      );
      if (result == null)
        return res.status(404).json({ error: "Post not found" });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error toggling like" });
    }
  }

  async apiListPosts(req, res) {
    const { q, search, authorName, title, likedBy, from, to, sortBy } =
      req.query || {};
    const posts = await this.service.getPosts({
      search: q || search || undefined,
      authorName: authorName || undefined,
      title: title || undefined,
      likedBy: likedBy || undefined,
      from: from || undefined,
      to: to || undefined,
      sortBy: sortBy || undefined,
    });
    res.json({ posts });
  }

  async apiListFeatures(req, res) {
    const features = await this.service.getFeatures();
    res.json({ features });
  }

  async updatePost(req, res) {
    try {
      const id = req.params.id;
      const { title, image, content, author } = req.body || {};
      const updated = await this.service.updatePost(id, {
        title,
        image,
        content,
        author,
      });
      if (!updated) return res.status(404).send("Post not found");
      if (
        (req.headers.accept || "").includes("application/json") ||
        req.path.startsWith("/api")
      ) {
        return res.json({ post: updated });
      }
      res.redirect(`/blog/${id}`);
    } catch (error) {
      console.error(error);
      if (
        (req.headers.accept || "").includes("application/json") ||
        req.path.startsWith("/api")
      ) {
        return res.status(500).json({ error: "Error updating post" });
      }
      res.status(500).send("Error updating post");
    }
  }

  async deletePost(req, res) {
    try {
      const id = req.params.id;
      const ok = await this.service.deletePost(id);
      if (!ok) return res.status(404).send("Post not found");
      if (
        (req.headers.accept || "").includes("application/json") ||
        req.path.startsWith("/api")
      ) {
        return res.json({ deleted: true });
      }
      res.redirect("/blog");
    } catch (error) {
      console.error(error);
      if (
        (req.headers.accept || "").includes("application/json") ||
        req.path.startsWith("/api")
      ) {
        return res.status(500).json({ error: "Error deleting post" });
      }
      res.status(500).send("Error deleting post");
    }
  }
}

module.exports = BlogController;
