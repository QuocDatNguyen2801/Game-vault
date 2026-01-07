const fs = require("fs");
const path = require("path");

/**
 * Returns the avatar path if the file exists, otherwise returns the default avatar path.
 * @param {string} avatarPath - The relative path to the avatar (e.g. '/uploads/filename.jpg')
 * @returns {string} - The path to use in the view
 */
function getSafeAvatarPath(avatarPath) {
  if (!avatarPath || avatarPath === "") return "/img/default-avatar.png";

  // Ensure leading slash and resolve against uploads (served via /uploads)
  const normalized = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  const fullPath = path.join(__dirname, "../..", normalized);

  try {
    if (fs.existsSync(fullPath)) {
      return normalized;
    }
  } catch (e) {}
  return "/img/default-avatar.png";
}

module.exports = { getSafeAvatarPath };
