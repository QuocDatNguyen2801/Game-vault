const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");
const slugify = require("../utils/slugify");

async function buildUniqueSlug(title) {
  const base = slugify(title || "");
  const fallback = base || "review";
  let candidate = fallback;
  let suffix = 1;

  while (await Review.exists({ slug: candidate })) {
    candidate = `${fallback}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

// show all reviews
async function getAllReviews() {
  try {
    return await Review.find({ isHidden: { $ne: true } })
      .sort({ date: -1 })
      .lean();
  } catch (err) {
    console.error("Error fetching all reviews:", err);
    return [];
  }
}

// get a specific review
async function getReviewById(id) {
  if (!id) return null;
  try {
    return await Review.findOne({ _id: id, isHidden: { $ne: true } }).lean();
  } catch (err) {
    console.error("Error fetching review by ID:", err);
    return null;
  }
}

// create review
async function addReview({
  title,
  stars,
  description,
  userId,
  user,
  gameId,
  gameTitle,
  imageUrl,
}) {
  try {
    let targetProduct = null;

    if (gameId && mongoose.Types.ObjectId.isValid(gameId)) {
      targetProduct = await Product.findOne({
        _id: gameId,
        isDisabled: { $ne: true },
      });
    }

    if (!targetProduct && gameTitle) {
      targetProduct = await Product.findOne({
        title: gameTitle,
        isDisabled: { $ne: true },
      });
    }

    if (!targetProduct) {
      throw new Error("Product not found!");
    }

    const allReviewsIds = await Review.find({ _id: /^reviewNo/ }, '_id').lean();

    let nextNum = 1;
    if (allReviewsIds.length > 0) {
        const nums = allReviewsIds.map(r => parseInt(r._id.replace("reviewNo", "")));
        nextNum = Math.max(...nums) + 1;
    }

    const slug = await buildUniqueSlug(title);

    const newReview = new Review({
      _id: `reviewNo${nextNum}`,
      title,
      slug,
      stars: Number(stars),
      content: Array.isArray(description) ? description : [description],
      userId: userId,
      user: user,
      gameTitle: targetProduct.title,
      gameId: targetProduct._id,
      img: imageUrl || targetProduct.image,
      date: new Date(),
    });

    const savedReview = await newReview.save();
    await updateGameRating(targetProduct.title);

    return savedReview;
  } catch (err) {
    console.error("Failed to save review to MongoDB:", err);
    return null;
  }
}

// edit review
async function updateReview(id, data) {
  if (!id) return null;
  try {
    data.isEdited = true;
    const updated = await Review.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (updated && data.stars) {
      await updateGameRating(updated.gameTitle);
    }
    return updated;
  } catch (err) {
    console.error("Update review error:", err);
    return null;
  }
}

// delete review
async function deleteReview(id) {
  if (!id) return null;
  try {
    const reviewToDelete = await Review.findById(id);
    if (!reviewToDelete) return null;

    const gameTitle = reviewToDelete.gameTitle;
    await Review.findByIdAndDelete(id);

    await updateGameRating(gameTitle);
    return true;
  } catch (err) {
    console.error("Delete review error:", err);
    return false;
  }
}

// update overall rating of a game
async function updateGameRating(gameTitle) {
  if (!gameTitle) return;

  try {
    const stats = await Review.aggregate([
      { $match: { gameTitle: gameTitle, isHidden: { $ne: true } } },
      {
        $group: {
          _id: "$gameTitle",
          avgRating: { $avg: "$stars" },
          count: { $sum: 1 },
        },
      },
    ]);

    let newRating = 0;
    if (stats.length > 0) {
      newRating = stats[0].avgRating.toFixed(1);
    }

    await Product.findOneAndUpdate(
      { title: gameTitle },
      { rating: Number(newRating) }
    );

    console.log(`Updated MongoDB rating for ${gameTitle}: ${newRating}`);
  } catch (err) {
    console.error("Error updating game rating in DB:", err);
  }
}

// get products
async function getAllProducts() {
  try {
    return await Product.find(
      { isDisabled: { $ne: true } },
      "_id title"
    ).lean();
  } catch (err) {
    console.error("Error fetching products for dropdown:", err);
    return [];
  }
}

// get user
async function findUserById(id) {
  if (!id) return null;

  try {
    const user = await User.findById(id).lean();

    if (!user) {
      console.log(`User with ID ${id} not found!`);
      return null;
    }

    return user;
  } catch (err) {
    console.error("Error in find user ID: ", err);
    return null;
  }
}

module.exports = {
  getAllReviews,
  getReviewById,
  addReview,
  updateReview,
  deleteReview,
  updateGameRating,
  getAllProducts,
  findUserById,
};
