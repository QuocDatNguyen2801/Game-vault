// public/js/forum.js

// Global like function called from onclick in EJS
window.likeThread = async function (id, btn) {
  if (!id || !btn) return;

  try {
    const res = await fetch(`/forum/like/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.redirected) {
      window.location.href = "/user/signin?next=/forum";
      return;
    }

    if (!res.ok) throw new Error("Network error");

    const data = await res.json();
    console.log("Like response:", data);

    // Update like count text
    const countSpan = btn.querySelector(".like-count");
    if (countSpan && typeof data.likes === "number") {
      countSpan.textContent = ` ${data.likes} `;
    }

    // Toggle liked class & icon based on server state
    btn.classList.toggle("liked", !!data.liked);
    const icon = btn.querySelector("i");
    if (icon) {
      if (data.liked) {
        icon.classList.remove("bi-hand-thumbs-up");
        icon.classList.add("bi-hand-thumbs-up-fill");
      } else {
        icon.classList.remove("bi-hand-thumbs-up-fill");
        icon.classList.add("bi-hand-thumbs-up");
      }
    }

    // keep data-likes up to date for sorting
    const card = btn.closest(".thread-card");
    if (card) {
      card.dataset.likes = data.likes;
    }
  } catch (err) {
    console.error("Error liking thread:", err);
    //alert("Failed to like thread. Please try again.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("forum.js loaded");

  const threadList = document.getElementById("threadList");
  const searchInput = document.getElementById("searchBar");
  const sortLabel = document.getElementById("selectedSortOption");
  const sortOptions = document.querySelectorAll(
    ".forum-dropdown.dropdown-menu .dropdown-item"
  );

  // Helper: get all thread cards
  function getThreadCards() {
    if (!threadList) return [];
    return Array.from(threadList.querySelectorAll(".thread-card"));
  }

  // DELETE BUTTONS
  function bindDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!id) return;

        try {
          const res = await fetch(`/forum/delete/${id}`, {
            method: "DELETE",
          });

          if (res.status === 401 || res.status === 403 || res.redirected) {
            window.location.href = "/user/signin?next=/forum";
            return;
          }

          if (!res.ok) throw new Error("Network error");
          const data = await res.json();

          if (data.success) {
            const card = btn.closest(".thread-card");
            if (card) {
              card.remove();
            }
          } else {
            alert(data.error || "Could not delete thread.");
          }
        } catch (err) {
          console.error("Error deleting thread:", err);
          alert("Failed to delete thread. Please try again.");
        }
      });
    });
  }

  // SEARCH (client-side filter)
  function bindSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      const cards = getThreadCards();

      cards.forEach((card) => {
        const title = card
          .querySelector(".thread-title")
          ?.textContent.toLowerCase();
        const author = card.querySelector(".author")?.textContent.toLowerCase();
        const content = card
          .querySelector(".thread-content")
          ?.textContent.toLowerCase();

        const matches =
          (title && title.includes(q)) ||
          (author && author.includes(q)) ||
          (content && content.includes(q));

        card.style.display = matches ? "" : "none";
      });
    });
  }

  function bindSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      const cards = getThreadCards();
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = card
          .querySelector(".thread-title")
          ?.textContent.toLowerCase();
        const author = card.querySelector(".author")?.textContent.toLowerCase();
        const content = card
          .querySelector(".thread-content")
          ?.textContent.toLowerCase();

        const matches =
          (title && title.includes(q)) ||
          (author && author.includes(q)) ||
          (content && content.includes(q));

        card.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
      });

      const noResultsMsg = document.getElementById("noResultsMessage");
      if (noResultsMsg) {
        noResultsMsg.style.display =
          visibleCount === 0 && q.length > 0 ? "block" : "none";
      }
    });
  }

  // SORTING
  function sortThreads(mode) {
    const cards = getThreadCards();

    const sorted = cards.sort((a, b) => {
      const createdA = new Date(a.dataset.createdAt || "");
      const createdB = new Date(b.dataset.createdAt || "");
      const likesA = parseInt(a.dataset.likes || "0", 10);
      const likesB = parseInt(b.dataset.likes || "0", 10);
      const repliesA = parseInt(a.dataset.replies || "0", 10);
      const repliesB = parseInt(b.dataset.replies || "0", 10);

      switch (mode) {
        case "Oldest First":
          return createdA - createdB;

        case "Most Popular":
          if (repliesB !== repliesA) return repliesB - repliesA;
          if (likesB !== likesA) return likesB - likesA;
          return createdB - createdA;

        case "Most Liked":
          if (likesB !== likesA) return likesB - likesA;
          return createdB - createdA;

        case "Newest First":
        default:
          return createdB - createdA;
      }
    });

    sorted.forEach((card) => threadList.appendChild(card));
  }

  function bindSortDropdown() {
    sortOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const mode = option.dataset.value;
        if (!mode) return;

        if (sortLabel) {
          sortLabel.textContent = mode;
        }

        sortOptions.forEach((opt) => opt.classList.remove("active"));
        option.classList.add("active");

        sortThreads(mode);
      });
    });

    sortThreads("Newest First");
  }

  // Init (delete/search/sort)
  bindDeleteButtons();
  bindSearch();
  bindSortDropdown();
});
