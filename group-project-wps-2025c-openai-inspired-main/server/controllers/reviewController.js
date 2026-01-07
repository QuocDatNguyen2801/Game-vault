const reviewStorage = require("../data/reviewStorage");

// get "/api/reviews"
exports.getAllReviews = async (req, res) => {
    const list = await reviewStorage.getAllReviews();
    res.json(list);
};

// get "/api/reviews/:id"
exports.getReviewById = async (req, res) => {
    const id = req.params.id;
    const review = await reviewStorage.getReviewById(id);

    if (!review) {
        return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
};

// post "/api/reviews"
exports.addReview = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).send("You must be logged in to post a review!");
    }

    const { title, rating, description, gameTitle, gameId, imageUrl } = req.body;

    if (!title || !rating || !description) {
        return res
        .status(400)
        .json({ message: "Title, rating and description are required" });
    }

    const stars = Number(rating);
    if (Number.isNaN(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    let authorName = "";
    const currentUserId = req.session.userId;

    // check if users have logged in
    if (currentUserId) {
        const currentUser = await reviewStorage.findUserById(currentUserId);

        if (currentUser) {
            authorName = currentUser.username;
        }
    }

    const slugify = require('../utils/slugify');
    const review = await reviewStorage.addReview({
        title: title.trim(),
        slug: slugify(title.trim()),
        stars,
        description: description,
        userId: currentUserId,
        user: authorName,
        gameTitle,
        gameId,
        imageUrl: imageUrl,
    });

    res.status(201).json(review);
};

// Editing requests
exports.updateReview = async (req, res) => {
    const id = req.params.id;
    const { title, rating, description, imageUrl } = req.body;

    const updatePayload = { title };

    if (imageUrl) {
        updatePayload.img = imageUrl;
    }

    if (rating !== undefined) {
        const stars = Number(rating);
        
        if (!Number.isNaN(stars)) {
            updatePayload.stars = stars;
        }
    }

    if (description !== undefined) {
        updatePayload.content = Array.isArray(description) ? description : [description];
    }

    const updated = await reviewStorage.updateReview(id, updatePayload);

    if (!updated) {
        return res.status(404).send("Review not found");
    }

    res.json(updated);
};

// Delete "/api/reviews/:id"
exports.deleteReview = async (req, res) => {
    const id = req.params.id;
    const deleted = await reviewStorage.deleteReview(id);

    if (!deleted) {
        return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await reviewStorage.getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};