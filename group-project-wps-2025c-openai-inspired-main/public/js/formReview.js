// wait for all resources to be loaded
window.addEventListener("load", function() {
    console.log("Window load event fired - initializing review form");
    initializeReviewForm();
});

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded event fired - checking if form elements exist");
    setTimeout(() => {
        if (!window.reviewFormInitialized) {
            initializeReviewForm();
        }
    }, 100);
});

function initializeReviewForm() {
    if (window.reviewFormInitialized) return;
    window.reviewFormInitialized = true;
    
    console.log("initializeReviewForm started");
    const overlay = document.getElementById("reviewOverlay");
    const openBtn = document.getElementById("openReviewButton");
    const close_btn = document.querySelector(".close-btn");
    const closeFooterBtn = document.querySelector(".rev-form-cls-btn");
    let editingReviewId = null;

    console.log("Elements found:", {
        overlay: !!overlay,
        openBtn: !!openBtn,
        close_btn: !!close_btn,
        closeFooterBtn: !!closeFooterBtn
    });

    const urlParams = new URLSearchParams(window.location.search);
    const targetGameFromUrl = urlParams.get('game'); 
    const gameDetailContainer = document.getElementById("game-detail-reviews");

    function showSuccessNotification(message) {
        const notification = document.getElementById("successNotification");
        const notificationText = document.getElementById("notificationText");
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.classList.add("show"); 

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert(message);
            window.location.reload();
        }
    }

    // form fields
    const reviewTitleInput = document.getElementById("review-brief-title");
    const reviewDescInput = document.getElementById("review-description");
    const reviewRatingInput = document.getElementById("review-rating");
    const reviewRatingText = document.getElementById("ratingText");
    const reviewImageInput = document.getElementById("review-image");

    console.log("Form fields found:", {
        reviewTitleInput: !!reviewTitleInput,
        reviewDescInput: !!reviewDescInput,
        reviewRatingInput: !!reviewRatingInput,
        reviewRatingText: !!reviewRatingText,
        reviewImageInput: !!reviewImageInput
    });

    // check if critical form elements exist
    if (!overlay || !reviewTitleInput || !reviewDescInput || !reviewRatingInput || !reviewRatingText || !reviewImageInput) {
        console.error("Review form elements not found - stopping initialization");
        return;
    }

    // web storage
    function saveReviewDraftToStorage() {
        localStorage.setItem("draft_review_title", reviewTitleInput.value);
        localStorage.setItem("draft_review_description", reviewDescInput.value);
        localStorage.setItem("draft_review_rating", reviewRatingInput.value);
        localStorage.setItem("draft_review_image_name", reviewImageInput?.files?.[0]?.name || "");
    }

    function loadReviewDraftFromStorage() {
        const savedReviewTitle = localStorage.getItem("draft_review_title");
        const savedReviewDescription = localStorage.getItem("draft_review_description");
        const savedReviewRating = localStorage.getItem("draft_review_rating");
        const savedImageUpload = localStorage.getItem("draft_review_image_name");

        if (savedReviewTitle) reviewTitleInput.value = savedReviewTitle;
        if (savedReviewDescription) reviewDescInput.value = savedReviewDescription;
        if (savedReviewRating) {
            reviewRatingInput.value = savedReviewRating;
            reviewRatingText.textContent = "★".repeat(savedReviewRating) + "☆".repeat(5 - savedReviewRating);
        }
        if (savedImageUpload) {
            const imageErrorContainer = document.getElementById("review-image-error");
            
            if (imageErrorContainer) {
                imageErrorContainer.style.color = "#e62228";
                imageErrorContainer.textContent = `(Note: You previously selected "${savedImageUpload}". If you keep heading to post it, please select it again!)`;
            }
        }
    }

    function clearReviewDraftStorage() {
        localStorage.removeItem("draft_review_title");
        localStorage.removeItem("draft_review_description");
        localStorage.removeItem("draft_review_rating");
        localStorage.removeItem("draft_review_image_name");
    }

    // load draft on page load
    loadReviewDraftFromStorage();

    // save on typing
    if (reviewTitleInput) reviewTitleInput.addEventListener("input", saveReviewDraftToStorage);
    if (reviewDescInput) reviewDescInput.addEventListener("input", saveReviewDraftToStorage);
    if (reviewRatingInput) reviewRatingInput.addEventListener("change", saveReviewDraftToStorage);
    if (reviewImageInput) reviewImageInput.addEventListener("change", saveReviewDraftToStorage);

    // only proceed if modal elements exist
    if (!overlay || !close_btn || !closeFooterBtn) {
        console.error("Modal elements not found", {
            overlay: !!overlay,
            close_btn: !!close_btn,
            closeFooterBtn: !!closeFooterBtn
        });
        return;
    }

    console.log("All elements found - setting up event listeners");

    // Setup openBtn event listener if it exists
    if (openBtn) {
        console.log("Setting up openBtn click listener");
        openBtn.addEventListener("click", () => {
            console.log("openBtn clicked");
            editingReviewId = null; 
            document.querySelector("#reviewHeader").textContent = "Write a Review";
            document.querySelector(".rev-form-sm-btn").textContent = "Submit Review";
            document.querySelector(".rev-form-cls-btn").textContent = "Close";

            reviewTitleInput.value = "";
            reviewDescInput.value = "";

            overlay.classList.add("show");
        });
    } else {
        console.warn("openBtn not found");
    }

    close_btn.addEventListener("click", () => {
        console.log("close_btn clicked");
        overlay.classList.remove("show");
    });

    closeFooterBtn.addEventListener("click", () => {
        console.log("closeFooterBtn clicked");
        overlay.classList.remove("show");
    });

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
            overlay.classList.remove("show");
        }
    });

    const ratingSelect = document.getElementById("ratingSelect");
    const ratingTrigger = ratingSelect.querySelector(".rating-select-trigger");
    const ratingMenu = ratingSelect.querySelector(".rating-select-menu");

    ratingTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        ratingSelect.classList.toggle("open");
    });

    ratingMenu.addEventListener("click", function (e) {
        const item = e.target.closest("li");
        if (!item) return;

        const value = item.dataset.value;
        reviewRatingInput.value = value;
        reviewRatingText.textContent = item.textContent;

        saveReviewDraftToStorage(); // autosave rating change

        ratingSelect.classList.remove("open");
    });

    document.addEventListener("click", function () {
        ratingSelect.classList.remove("open");
    });

    // limitations of the form
    const REV_MAX_TITLE_LENGTH = 80;
    const REV_MAX_DESC_LENGTH = 2000;
    const REV_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const REV_ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

    // error containers
    const reviewTitleError = document.getElementById("review-title-error");
    const reviewDescError = document.getElementById("review-description-error");
    const reviewImageError = document.getElementById("review-image-error");

    // validation helpers
    function sanitizeInput(str) {
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // check if the title is valid
    function validateReviewTitle() {
        const value = reviewTitleInput.value.trim();
        let valid = true;

        if (value.length === 0) {
            if (reviewTitleError) reviewTitleError.textContent = "(!) Title cannot be empty.";
            reviewTitleInput.classList.add("review-invalid");
            valid = false;
        } else if (value.length > REV_MAX_TITLE_LENGTH) {
            if (reviewTitleError) reviewTitleError.textContent = `(!) Title cannot exceed ${REV_MAX_TITLE_LENGTH} characters.`;
            reviewTitleInput.classList.add("review-invalid");
            valid = false;
        } else {
            if (reviewTitleError) reviewTitleError.textContent = "";
            reviewTitleInput.classList.remove("review-invalid");
        }

        return valid;
    }

    // check if the description is valid
    function validateReviewDescription() {
        const value = reviewDescInput.value.trim();
        let valid = true;

        if (value.length === 0) {
            if (reviewDescError) reviewDescError.textContent = "(!) Description cannot be empty.";
            reviewDescInput.classList.add("review-invalid");
            valid = false;
        } else if (value.length > REV_MAX_DESC_LENGTH) {
            if (reviewDescError) reviewDescError.textContent = `(!) Description cannot exceed ${REV_MAX_DESC_LENGTH} characters.`;
            reviewDescInput.classList.add("review-invalid");
            valid = false;
        } else {
            if (reviewDescError) reviewDescError.textContent = "";
            reviewDescInput.classList.remove("review-invalid");
        }

        return valid;
    }

    // check if the image uploaded is valid
    function validateReviewImage() {
        const file = reviewImageInput.files[0];
        let valid = true;

        if (!file) {
            if (reviewImageError) reviewImageError.textContent = "";
            reviewImageInput.classList.remove("review-invalid");
            return true;
        }

        if (!REV_ALLOWED_FILE_TYPES.includes(file.type)) {
            if (reviewImageError) reviewImageError.textContent = "(!) Only JPG or PNG images are allowed.";
            reviewImageInput.classList.add("review-invalid");
            valid = false;
        } else if (file.size > REV_MAX_FILE_SIZE) {
            if (reviewImageError) reviewImageError.textContent = "(!) Image size must be less than 10MB.";
            reviewImageInput.classList.add("review-invalid");
            valid = false;
        } else {
            if (reviewImageError) reviewImageError.textContent = "";
            reviewImageInput.classList.remove("review-invalid");
        }

        return valid;
    }

    function validateReviewForm() {
        const validRevTitle = validateReviewTitle();
        const validRevDesc = validateReviewDescription();
        const validRevImg = validateReviewImage();
        return validRevTitle && validRevDesc && validRevImg;
    }

    // live and responsive validation
    reviewTitleInput?.addEventListener("input", validateReviewTitle);
    reviewDescInput?.addEventListener("input", validateReviewDescription);
    reviewImageInput?.addEventListener("change", validateReviewImage);

    // keep the current image when editing
    let currentEditingImage = "";

    // edit review
    window.addEventListener("edit-review", async (e) => {
        editingReviewId = e.detail.id;

        const res = await fetch(`/api/reviews/${editingReviewId}`);
        const data = await res.json(); 
        currentEditingImage = data.img;

        reviewTitleInput.value = data.title;
        reviewDescInput.value = Array.isArray(data.content) ? data.content.join("\n\n") : data.content;
        reviewRatingInput.value = data.stars;
        reviewRatingText.textContent = "★".repeat(data.stars) + "☆".repeat(5 - data.stars);

        overlay.classList.add("show");

        document.querySelector("#reviewHeader").textContent = "Edit Your Review";
        document.querySelector(".rev-form-sm-btn").textContent = "Save Changes";
        document.querySelector(".rev-form-cls-btn").textContent = "Cancel";

        // clear draft
        clearReviewDraftStorage();
    });


    const submitRevBtn = document.querySelector(".rev-form-sm-btn");
    submitRevBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        // check that users have logged in or not
        const loggedInInput = document.getElementById("currentLoggedInUser");
        const isLoggedIn = loggedInInput && loggedInInput.value.trim() !== "";

        if (!isLoggedIn) {
            alert("You've not logged in yet. Please log in to submit your reviews!");
            saveReviewDraftToStorage();
            window.location.href = "/user/signin";
            return;
        }

        const revTitle = reviewTitleInput.value.trim();
        const revDescription = reviewDescInput.value.trim();
        const revRating = reviewRatingInput.value;
        let currentGameId = null;
        let currentGameTitle = null;

        if (gameDetailContainer) {
            // if users are in product page
            currentGameId = gameDetailContainer.dataset.gameId;
            currentGameTitle = gameDetailContainer.dataset.gameTitle;
        } else if (targetGameFromUrl) {
            currentGameTitle = targetGameFromUrl;
            currentGameId = urlParams.get('gameId');
        } else {
            currentGameId = reviewSelectedGameId.value;
            currentGameTitle = reviewSelectedGameTitle.value;
        }

        // Validate form FIRST before processing
        if (!validateReviewForm()) {
            return;
        }

        let finalImageURL = editingReviewId ? currentEditingImage : "";
        const file = reviewImageInput.files[0];

        if (file) {
            const formData = new FormData();
            formData.append("image", file);

            try {
                const uploadRes = await fetch("/api/review-image", {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok){
                    const uploadData = await uploadRes.json();
                    finalImageURL = uploadData.imageUrl;
                } else {
                    alert("Failed to upload image!");
                    return;
                }
            } catch (err) {
                console.err("Upload error: ", err);
                alert("Cannot upload your image!");
                return;
            }
        }

        // sanitize inputs before sending info
        const sanitizedTitle = sanitizeInput(revTitle);
        const sanitizedDescription = sanitizeInput(revDescription);

        // split passages
        const descArray = sanitizedDescription.split(/\r?\n/).filter(p => p.trim());

        // update review
        if (editingReviewId) {
            const res = await fetch(`/api/reviews/${editingReviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: sanitizedTitle,
                    description: descArray,
                    rating: revRating,
                    imageUrl: finalImageURL
                })
            });

            if (!res.ok) {
                alert("Failed to update review!");
                return;
            }

            editingReviewId = null;
            overlay.classList.remove("show");

            clearReviewDraftStorage(); // clear draft on successful submit

            showSuccessNotification("Review updated successfully!");
            return;
        }

        // create review
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: sanitizedTitle,
                    rating: revRating,
                    description: descArray,
                    imageUrl: finalImageURL,
                    gameId: currentGameId,
                    gameTitle: currentGameTitle
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                alert("Server responded with: " + errorText);
                return;
            }

            await res.json();

            reviewTitleInput.value = "";
            reviewDescInput.value = "";
            reviewRatingInput.value = 5;
            reviewRatingText.textContent = "★★★★★";
            overlay.classList.remove("show");

            clearReviewDraftStorage(); // clear draft on successful submit

            showSuccessNotification("Review created successfully!");
        } catch (err) {
            console.error(err);
            alert("Network error while submitting your review.");
        }
    });
}