// Generate Bootstrap Star Icons
function generateStars(count) {
    let starsHTML = "";
    const rating = Number(count);

    // If rating 5 stars
    for (let i = 0; i < rating; i++) {
        starsHTML += `<i class="bi bi-star-fill"></i>`;
    }

    // If rating 4 stars or lower
    for (let i = rating; i < 5; i++) {
        starsHTML += `<i class="bi bi-star"></i>`
    }

    return starsHTML;
}

// Global array to store all reviews
let allReviews = [];

// global array to store filtered reviews
let currentFilteredReviews = [];

// reviews count being displayed
let visibleCount = 3;

// save default star ratings and time sorting
let currentStarFilter = "All Stars";
let currentTimeSort = "latest";

// show success notifications after create, edit or delete reviews
function showSuccessNotification(message) {
    const notification = document.getElementById("successNotification");
    const notificationText = document.getElementById("notificationText");
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.add("show");

        setTimeout(() => {
            notification.classList.remove("show");
        }, 1000);
    } else {
        alert(message);
        loadReviews();
    }
}

// function to update the buttons state
function updateButtonsState() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const showLessBtn = document.getElementById("showLessBtn");

    if (!loadMoreBtn || !showLessBtn) return;

    // display "show more reviews" button if the amount of reviews is less than all reviews
    if (visibleCount < currentFilteredReviews.length) {
        loadMoreBtn.style.display = "inline-block";
    } else {
        loadMoreBtn.style.display = "none";
    }

    // display "show less reviews" button if the current amount is more than visible count (3 reviews)
    if (visibleCount > 3) {
        showLessBtn.style.display = "inline-block";
    } else {
        showLessBtn.style.display = "none";
    }
}

// function for rendering review cards by amount of visible counts
function renderVisibleReviews() {
    const currentList = currentFilteredReviews.slice(0, visibleCount);
    renderReviewCards(currentList);
    updateButtonsState();

    const noMsg = document.getElementById("noReviewsMessage");
    if(noMsg) {
        noMsg.style.display = currentList.length === 0 ? "block" : "none";
    }
}

// Function to load Review Cards
async function loadReviews() {
    const reviewsContainer = document.querySelector(".reviews-container");
    if (!reviewsContainer) return;

    try {
        const res = await fetch("/api/reviews");
        if (!res.ok) {
            console.error("Failed to load reviews", res.status);
            return;
        }

        allReviews = await res.json(); 

        // check that users are in Product page or Review page
        const gameDetailContainer = document.getElementById("game-detail-reviews");

        if (gameDetailContainer) {
            // Users in Product page
            document.getElementById("review-filter-dropdown").style.display = "none";

            // follow the name of the target game
            const targetGameTitle = gameDetailContainer.dataset.gameTitle;

            // only show reviews for a target game
            currentFilteredReviews = allReviews.filter(r => r.gameTitle === targetGameTitle);

            // show only 3 latest reviews
            visibleCount = 3;

            if (currentFilteredReviews.length === 0) {
                document.getElementById("noReviewsMessage").style.display = "block";
                document.getElementById("seeAllReviews").style.display = "none";
            }

            renderReviewCards(currentFilteredReviews.slice(0, visibleCount));
        }
        else {
            // Users in Review page

            // check the url if filtering game is required
            const urlParams = new URLSearchParams(window.location.search);
            const targetGame = urlParams.get('game');

            if (targetGame) {
                // if params '?game=...' appears, filter it
                currentFilteredReviews = allReviews.filter(r => r.gameTitle === targetGame);
            } else {
                currentFilteredReviews = [...allReviews];
            }

            visibleCount = 3;
            if (visibleCount > allReviews.length) visibleCount = 3;
    
            // Check if there are no reviews
            if (allReviews.length === 0) {
                showNoReviewsMessage();
                updateButtonsState();
                return;
            }
    
            renderVisibleReviews();
        }

    } catch (err) {
        console.error("Error while loading reviews", err);
    }
}

// Helper function to render any list of reviews
function renderReviewCards(list) {
    const reviewsContainer = document.querySelector(".reviews-container");
    if(!reviewsContainer) return;
    reviewsContainer.innerHTML = "";

    // take the current logged-in username
    const loggedInInput = document.getElementById("currentLoggedInUser");
    const loggedInUser = loggedInInput ? loggedInInput.value : "";
    const isAdmin = document.getElementById("isAdminUser")?.value === "true";

    list.forEach((r) => {
        // This line of code is to compare the author
        console.log(`Review ID: ${r._id} | Author: "${r.user}" | Compared To: "${loggedInUser}" | Result: ${r.user === loggedInUser}`);

        const card = document.createElement("div");
        card.classList.add("customer-review-card");

        // check the author
        const isMyReview = (loggedInUser && r.user === loggedInUser);

        if (isMyReview && !isAdmin) {
            card.classList.add("my-review-card"); 
        }

        let menuHTML = "";
        if (isAdmin) {
            // Admin authority
            menuHTML = `
                <div class="review-menu">
                    <i class="bi bi-three-dots-vertical review-menu-icon"></i>
                    <div class="review-menu-dropdown">
                        <div class="menu-item delete-review-item" data-id="${r._id}">Delete</div>
                    </div>
                </div>
            `;
        } else if (isMyReview) {
            // User authority
            menuHTML = `
                <div class="review-menu">
                    <i class="bi bi-three-dots-vertical review-menu-icon"></i>
                    <div class="review-menu-dropdown">
                        <div class="menu-item edit-review-item" data-id="${r._id}">Edit</div>
                        <div class="menu-item delete-review-item" data-id="${r._id}">Delete</div>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <img src="${r.img}" alt="Review image">

            <div class="review-content">
                <a href="/reviews/${r._id}">
                    <h3>
                        ${r.title}
                        ${r.isEdited ? '<span class="edited-text">(Edited)</span>' : ''}
                    </h3>
                </a>

                <div class="review-meta">
                    <span class="meta-item"><i class="bi bi-person"></i> ${r.user}</span>
                    <span class="meta-item"><i class="bi bi-calendar4"></i> ${new Date(r.date).toLocaleDateString("vi-VN")}</span>
                </div>
            </div>

            <div class="stars">${generateStars(r.stars)}</div>

            ${menuHTML}
        `;

        reviewsContainer.appendChild(card);
    });
}

// Load reviews when page loads
document.addEventListener("DOMContentLoaded", loadReviews);

// load the show more/less review buttons
document.addEventListener("DOMContentLoaded", () => {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const showLessBtn = document.getElementById("showLessBtn");

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            visibleCount += 3;

            if (visibleCount > currentFilteredReviews.length) {
                visibleCount = currentFilteredReviews.length;
            }
            renderVisibleReviews();
        });
    }

    if (showLessBtn) {
        showLessBtn.addEventListener("click", () => {
            visibleCount = 3;
            renderVisibleReviews();
            
            // scroll to the top after clicking on show less button
            document.querySelector(".customer-review.title").scrollIntoView({ behavior: "smooth" });
        });
    }

    loadReviews();
});

// Star filtering dropdown 
const sortStarItems = document.querySelectorAll(".star-filter-item");
if (sortStarItems) {
    sortStarItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();

            const selectedText = this.getAttribute("data-value");
            const display = document.getElementById("selectedSortOption");
            
            // Remove 'selected' class from all items
            sortStarItems.forEach(el => {
                el.classList.remove("selected");
            });
            
            // Add 'selected' class to clicked item
            this.classList.add("selected");
            
            if(display) display.textContent = selectedText;
            applyStarFilter(selectedText);
        });
    });
}

// Apply filtering by stars
function applyStarFilter(selected) {
    currentStarFilter = selected;
    hideNoReviewsMessage();
    visibleCount = 3;

    // check if the filter is operating by following the game from URL 
    const urlParams = new URLSearchParams(window.location.search);
    const targetGame = urlParams.get('game');

    // if so, take the list of that game and get all, in contrast
    let baseList =  targetGame ? allReviews.filter(r => r.gameTitle === targetGame) : [...allReviews];

    // update current filtered reviews
    if (selected === "All Stars") {
        currentFilteredReviews = baseList;
    } else {
        const filteredStars = Number.parseInt(selected);
        currentFilteredReviews = baseList.filter(r => r.stars === filteredStars);
    }

    if (currentFilteredReviews == 0) {
        showNoReviewsMessage();

        // hide the show more and less buttons
        const loadMoreBtn = document.getElementById("loadMoreBtn");
        const showLessBtn = document.getElementById("showLessBtn");
        if(loadMoreBtn) loadMoreBtn.style.display = "none";
        if(showLessBtn) showLessBtn.style.display = "none";

        return;
    }

    currentFilteredReviews.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return currentTimeSort === "latest" ? dateB - dateA : dateA - dateB;
    });

    renderVisibleReviews(); 
    updateButtonsState();
}

// showing the error message if users choose the selection having no reviews
function showNoReviewsMessage() {
    document.getElementById("noReviewsMessage").style.display = "block";
    document.querySelector(".reviews-container").innerHTML = "";
}

function hideNoReviewsMessage() {
    document.getElementById("noReviewsMessage").style.display = "none";
}

// edit/delete reviews
document.addEventListener("click", function (e) {

    // toggle menu
    if (e.target.classList.contains("review-menu-icon")) {
        // close all other menus
        document.querySelectorAll(".review-menu-dropdown").forEach(m => {
            if (m !== e.target.nextElementSibling) m.style.display = "none";
        });

        const dropdown = e.target.nextElementSibling;
        dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
        e.stopPropagation();
        return;
    }

    // close menu when clicking outside
    document.querySelectorAll(".review-menu-dropdown").forEach(menu => {
        menu.style.display = "none";
    });

    // delete reviews
    if (e.target.classList.contains("delete-review-item")) {
        const reviewId = e.target.dataset.id;

        if (confirm("Do you really want to delete this review?")) {
            deleteReview(reviewId);
        }
    }

    // edit reviews
    if (e.target.classList.contains("edit-review-item")) {
        const reviewId = e.target.dataset.id;

        window.dispatchEvent(new CustomEvent("edit-review", {
            detail: { id: reviewId }
        }));
    }

    // close the editing form if clicking outside
    if (!e.target.closest(".review-menu")) {
        document.querySelectorAll(".review-menu-dropdown").forEach(menu => {
            menu.style.display = "none";
        });
    }
});

// Function for deleting reviews
async function deleteReview(reviewId) {
    try {
        const res = await fetch(`/api/reviews/${reviewId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            showSuccessNotification("Review deleted successfully!");
            loadReviews(); // Reload the review card
        } else {
            alert("Failed to delete the review! Please try again later!");
        }
    } catch (err) {
        console.error("Delete error", err);
    }
}

function sortReviewsByTime(order) {
    currentTimeSort = order;

    currentFilteredReviews.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return order === "latest" ? dateB - dateA : dateA - dateB;
    });

    visibleCount = 3; 
    renderVisibleReviews();
    updateButtonsState();
}

document.getElementById("timeSortMenu")?.addEventListener("click", function(e) {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;
    
    e.preventDefault();
    const order = item.dataset.time; 
    const text = item.textContent.trim();

    document.getElementById("selectedTimeOption").textContent = text;

    this.querySelectorAll(".dropdown-item").forEach(el => el.classList.remove("selected"));
    item.classList.add("selected");

    sortReviewsByTime(order);
});

const sortTimeItems = document.querySelectorAll(".time-filter-item");
sortTimeItems.forEach(item => {
    item.addEventListener("click", function (e) {
        e.preventDefault();
        const order = this.dataset.time;
        const text = this.textContent.trim();

        const timeDisplay = document.getElementById("selectedTimeOption");
        if(timeDisplay) timeDisplay.textContent = text;

        sortTimeItems.forEach(el => el.classList.remove("selected"));
        this.classList.add("selected");

        sortReviewsByTime(order);
    });
});

document.addEventListener("click", function(e) {
    const openBtn = e.target.closest("#openReviewButton");
    
    if (openBtn) {
        const isAdminInput = document.getElementById("isAdminUser");
        const isAdmin = isAdminInput ? isAdminInput.value === "true" : false;

        if (isAdmin) {
            // block admins from opening modal from console
            e.preventDefault();
            e.stopImmediatePropagation();
            
            alert("Admin accounts can just manage reviews, not to write review!");
            console.warn("Warning: Admin tries to access review form!");
            return false;
        }
    }
}, true);