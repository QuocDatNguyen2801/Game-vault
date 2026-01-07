document.addEventListener("DOMContentLoaded", () => {
  const confirmActions = document.querySelectorAll("[data-confirm]");
  confirmActions.forEach((el) => {
    el.addEventListener("submit", (e) => {
      const message = el.getAttribute("data-confirm") || "Are you sure?";
      if (!window.confirm(message)) {
        e.preventDefault();
      }
    });
  });
});
