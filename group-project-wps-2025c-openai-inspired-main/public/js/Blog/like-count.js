document.addEventListener("DOMContentLoaded", () => {
  if (window.__blogLikeHandlerBound) return; // guard against double-binding
  window.__blogLikeHandlerBound = true;
  const IS_SIGNED_IN =
    window.IS_SIGNED_IN === true || window.IS_SIGNED_IN === "true";
  const allButtons = (id) =>
    Array.from(
      document.querySelectorAll(
        `.like-btn[data-id="${CSS.escape(String(id))}"]`
      )
    );
  const allCounts = (id) =>
    Array.from(
      document.querySelectorAll(
        `.like-count[data-id="${CSS.escape(String(id))}"]`
      )
    );
  const getLikedFromDom = (id) => {
    const btn = allButtons(id)[0];
    if (!btn) return false;
    const likedAttr = btn.getAttribute("data-liked");
    if (likedAttr != null) return likedAttr === "true";
    return btn.classList.contains("is-liked");
  };

  const setButtonState = (btn, liked) => {
    btn.classList.toggle("is-liked", liked);
    btn.classList.toggle("is-unliked", !liked);
    btn.setAttribute("data-liked", liked ? "true" : "false");
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    const icon = btn.querySelector(".icon");
    if (icon) icon.textContent = liked ? "❤️" : "🤍";
    // Update the textual label to reflect state
    const label =
      btn.querySelector(".label") ||
      Array.from(btn.querySelectorAll("span")).find(
        (s) => !s.classList.contains("icon")
      );
    if (label) label.textContent = liked ? "Liked" : "Like";
  };

  // Initialize all like buttons based on local state
  document.querySelectorAll(".like-btn").forEach((btn) => {
    const id = btn.getAttribute("data-id");
    if (!id) return;
    const likedAttr = btn.getAttribute("data-liked");
    const liked = likedAttr === "true";
    setButtonState(btn, liked);
  });

  // Track in-flight requests per post to avoid double-toggles
  const inFlight = new Set();

  // Toggle handler (sync all instances of same post)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".like-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    if (!IS_SIGNED_IN) {
      window.location.href = "/user/signin?next=/blog";
      return;
    }

    const id = btn.getAttribute("data-id");
    if (!id) return;

    if (inFlight.has(id)) return; // ignore rapid double clicks
    inFlight.add(id);

    const prevCounts = allCounts(id).map((el) => Number(el.textContent || 0));
    // use first count as reference for optimistic update
    const prev = prevCounts.length ? prevCounts[0] : 0;
    const liked = !getLikedFromDom(id); // toggle target

    // Optimistic UI on all buttons/counts for this id
    const buttons = allButtons(id);
    buttons.forEach((b) => setButtonState(b, liked));
    const counts = allCounts(id);
    counts.forEach((countEl) => {
      const next = Math.max(0, (prev || 0) + (liked ? 1 : -1));
      countEl.textContent = String(next);
      countEl.classList.add("pulse");
      setTimeout(() => countEl.classList.remove("pulse"), 250);
    });

    try {
      const res = await fetch(
        `/blog/api/posts/${encodeURIComponent(id)}/like-toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ like: liked }),
        }
      );
      if (res.redirected) {
        window.location.href = res.url || "/user/signin?next=/blog";
        return;
      }
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/user/signin?next=/blog";
        return;
      }
      if (!res.ok) throw new Error("toggle failed");
      const data = await res.json();
      if (typeof data.likes === "number") {
        allCounts(id).forEach((countEl) => {
          countEl.textContent = String(Math.max(0, data.likes));
        });
      }
      const finalLiked = !!data.liked;
      const buttonsFinal = allButtons(id);
      buttonsFinal.forEach((b) => setButtonState(b, finalLiked));
    } catch (err) {
      // Revert optimistic UI on error
      buttons.forEach((b) => setButtonState(b, !liked));
      const countsRevert = allCounts(id);
      countsRevert.forEach((countEl, i) => {
        const fallback = prevCounts[i] ?? prev;
        countEl.textContent = String(fallback);
      });
      console.error(err);
    } finally {
      inFlight.delete(id);
    }
  });
});
