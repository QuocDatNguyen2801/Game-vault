// Generate star icons based on rating
function generateStars(rating) {
  let html = "";
  const fullStars = Math.round(Number(rating || 0));

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      html += `<i class="bi bi-star-fill"></i>`;
    } else {
      html += `<i class="bi bi-star star-color"></i>`;
    }
  }

  return html;
}

// Render a selected review
async function loadReview() {
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  try {
    const res = await fetch(`/api/reviews/${id}`);

    if (!res.ok) {
      document.getElementById("review-title").textContent = "Review Not Found";
      document.getElementById("review-content").innerHTML = `
        <p>The review you're trying to access does not exist.</p>
      `;
      document.getElementById("review-image").style.display = "none";
      return;
    }
    document.getElementById("review-image").style.display = "block";

    const data = await res.json();

    document.getElementById("review-title").textContent = data.title;
    document.getElementById("game-title").textContent = data.gameTitle;
    document.getElementById("review-author").textContent = data.user;
    document.getElementById("review-date").textContent = new Date(data.date).toLocaleDateString("vi-VN");
    document.getElementById("review-image").src = data.img;

    // Stars
    document.getElementById("review-stars").innerHTML = generateStars(
      Number(data.stars || 0)
    );

    // Content paragraphs
    const contentBox = document.getElementById("review-content");
    contentBox.innerHTML = "";

    if (Array.isArray(data.content) && data.content.length > 0) {
      data.content.forEach((p) => {
        contentBox.innerHTML += `<p>${p}</p>`;
      });
    } else if (data.content) {
      contentBox.innerHTML = `<p>${data.content}</p>`;
    } else {
      contentBox.innerHTML = `<p>No detailed content provided.</p>`;
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadReview);