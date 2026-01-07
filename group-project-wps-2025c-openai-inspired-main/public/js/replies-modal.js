// public/js/replies-modal.js
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("repliesOverlay");
  const closeBtn = document.getElementById("closeModal");
  const postBtn = document.getElementById("postReply");
  const replyInput = document.getElementById("replyInput");
  const repliesList = document.getElementById("repliesList");

  if (!overlay || !closeBtn || !postBtn || !replyInput || !repliesList) return;

  let currentThread = null;

  async function fetchReplies(threadId) {
    const res = await fetch(`/forum/${threadId}/replies`);
    if (!res.ok) throw new Error("Failed to load replies");
    const data = await res.json();
    return data.replies || [];
  }

  async function openReplies(el) {
    const threadId = el.dataset.threadId;
    const card = el.closest(".thread-card");
    if (!threadId || !card) return;

    currentThread = {
      id: threadId,
      title: card.querySelector(".thread-title")?.textContent || "",
      author: (card.querySelector(".author")?.textContent || "").replace(
        "By ",
        ""
      ),
      content: card.querySelector(".thread-content")?.textContent || "",
      avatar:
        card.querySelector(".thread-avatar")?.src || "https://i.pravatar.cc/52",
    };

    document.getElementById("modalAvatar").src = currentThread.avatar;
    document.getElementById("modalTitle").textContent = currentThread.title;
    document.getElementById(
      "modalAuthor"
    ).textContent = `By ${currentThread.author}`;
    document.getElementById("modalContent").textContent = currentThread.content;

    repliesList.innerHTML = "";
    try {
      const list = await fetchReplies(threadId);
      list.forEach(addReplyToList);
    } catch (err) {
      console.error(err);
    }

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function bindOpeners() {
    document.querySelectorAll(".replies.clickable").forEach((el) => {
      el.addEventListener("click", () => openReplies(el));
    });
  }

  function closeModal() {
    overlay.style.display = "none";
    document.body.style.overflow = "";
    replyInput.value = "";
  }

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  postBtn.addEventListener("click", async () => {
    const text = replyInput.value.trim();
    if (!text || !currentThread) return;

    try {
      const res = await fetch(`/forum/${currentThread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.status === 401 || res.redirected) {
        window.location.href = "/user/signin?next=/forum";
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to post reply");

      addReplyToList(data.reply);
      replyInput.value = "";

      const countEl = document.querySelector(
        `.replies[data-thread-id="${currentThread.id}"]`
      );
      if (countEl && typeof data.replies === "number") {
        countEl.textContent = `${data.replies} ${
          data.replies === 1 ? "Reply" : "Replies"
        }`;
        const card = countEl.closest(".thread-card");
        if (card) card.dataset.replies = data.replies;
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not post reply");
    }
  });

  function addReplyToList(reply) {
    const div = document.createElement("div");
    div.className = "reply-item";
    div.innerHTML = `
      <img src="${
        reply.avatar || "https://i.pravatar.cc/44"
      }" class="reply-avatar">
      <div class="reply-content">
        <div class="reply-author">${reply.author || "Anonymous"}</div>
        <p class="reply-text">${reply.content || ""}</p>
      </div>
    `;
    repliesList.appendChild(div);
  }

  bindOpeners();
});
