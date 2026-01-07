// Admin actions for blog cards: edit & delete
(function () {
  function findCard(el, postId) {
    const direct =
      el?.closest?.(".blog-card") ||
      el?.closest?.("[data-card]") ||
      el?.closest?.(".col-md-6, .col-lg-4");
    if (direct) return direct;
    if (postId) return document.querySelector(`[data-post-id="${postId}"]`);
    return null;
  }

  document.addEventListener("click", function (e) {
    const editEl = e.target.closest(".post-edit-btn");
    if (!editEl) return;
    e.preventDefault();
    e.stopPropagation();

    const id = editEl.getAttribute("data-id");
    const title = editEl.getAttribute("data-title") || "";
    const image = editEl.getAttribute("data-image") || "";
    const content = editEl.getAttribute("data-content") || "";

    const form = document.getElementById("editPostForm");
    if (!form) return;
    form.dataset.postId = id;

    const titleIpt = document.getElementById("editBlogTitle");
    const imageIpt = document.getElementById("editBlogImage");
    const contentIpt = document.getElementById("editBlogContent");

    if (titleIpt) titleIpt.value = title;
    if (imageIpt) imageIpt.value = image;
    if (contentIpt) contentIpt.value = content;

    const modalEl = document.getElementById("editPostModal");
    if (modalEl && window.bootstrap && typeof bootstrap.Modal === "function") {
      const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
      instance.show();
    }
  });

  // Handle edit form submit via JSON API
  document.addEventListener("submit", async function (e) {
    const form = e.target;
    if (form.id !== "editPostForm") return;
    e.preventDefault();

    const id = form.dataset.postId;
    if (!id) return;

    const payload = {
      title: form.title?.value?.trim() || "",
      // author is derived server-side; omit here
      image: form.image?.value?.trim() || "",
      content: form.content?.value?.trim() || "",
    };

    try {
      const res = await fetch(`/blog/api/posts/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");

      // Update card UI inline
      const modalEl = document.getElementById("editPostModal");
      const modalInstance =
        bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.hide();

      const card = findCard(form, id);
      if (card) {
        const titleEl = card.querySelector(".blog-card-title");
        if (titleEl) titleEl.textContent = data.post.title;
        const metaEl = card.querySelector(".blog-card-meta");
        const readMins =
          data.post.readMins ||
          Math.ceil((data.post.content ? data.post.content.length : 0) / 500);
        if (metaEl)
          metaEl.innerHTML = `By ${
            data.post.authorName || "Anonymous"
          } • ${readMins} mins read`;
        const imgEl = card.querySelector(".blog-card-image img");
        if (imgEl && data.post.image) imgEl.src = data.post.image;
        // Also update dataset on actions button
        const editBtn = card.querySelector(".post-edit-btn");
        if (editBtn) {
          editBtn.setAttribute("data-title", data.post.title || "");
          editBtn.setAttribute("data-author", data.post.authorName || "");
          editBtn.setAttribute("data-image", data.post.image || "");
          editBtn.setAttribute("data-content", data.post.content || "");
        }
      }
    } catch (err) {
      alert(err.message || "Error updating post");
    }
  });

  // Delete post via JSON API
  document.addEventListener("click", async function (e) {
    const delEl = e.target.closest(".post-delete-btn");
    if (!delEl) return;
    e.preventDefault();
    e.stopPropagation();

    const id = delEl.getAttribute("data-id");
    if (!id) return;

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/blog/api/posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.deleted)
        throw new Error(data?.error || "Failed to delete");
      const card = findCard(delEl);
      if (card) {
        const col = card.closest(".col-md-6, .col-lg-4") || card;
        col.remove();
      }
    } catch (err) {
      alert(err.message || "Error deleting post");
    }
  });
})();
