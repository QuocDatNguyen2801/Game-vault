// Toggle password visibility in signin form (for signin.ejs)
const passwordInputSignin = document.getElementById("signinPassword");
const toggleSigninPassword = document.getElementById("toggleSigninPassword");
const toggleSigninIcon = document.getElementById("toggleSigninIcon");

if (toggleSigninPassword) {
  toggleSigninPassword.addEventListener("click", function () {
    // Toggle the input type between 'password' and 'text'
    const type =
      passwordInputSignin.getAttribute("type") === "password"
        ? "text"
        : "password";
    passwordInputSignin.setAttribute("type", type);
    // Toggle the icon between eye and eye-slash
    if (type === "text") {
      toggleSigninIcon.classList.remove("bi-eye");
      toggleSigninIcon.classList.add("bi-eye-slash");
    } else {
      toggleSigninIcon.classList.remove("bi-eye-slash");
      toggleSigninIcon.classList.add("bi-eye");
    }
  });
}

// Toggle password visibility in signup form (for signup.ejs)
const passwordInputSignup = document.getElementById("signupPassword");
const toggleSignupPassword = document.getElementById("toggleSignupPassword");
const toggleSignupIcon = document.getElementById("toggleSignupIcon");
if (toggleSignupPassword) {
  toggleSignupPassword.addEventListener("click", function () {
    // Toggle the input type between 'password' and 'text'
    const type =
      passwordInputSignup.getAttribute("type") === "password"
        ? "text"
        : "password";
    passwordInputSignup.setAttribute("type", type);
    // Toggle the icon between eye and eye-slash
    if (type === "text") {
      toggleSignupIcon.classList.remove("bi-eye");
      toggleSignupIcon.classList.add("bi-eye-slash");
    } else {
      toggleSignupIcon.classList.remove("bi-eye-slash");
      toggleSignupIcon.classList.add("bi-eye");
    }
  });
}
// Toggle new password visibility
// Toggle confirm password visibility
const NewPasswordInput = document.getElementById("newPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleIconNewPassword = document.getElementById("toggleIconNewPassword");

const passwordInputConfirm = document.getElementById("confirmPassword");
const togglePasswordConfirm = document.getElementById("toggleConfirmPassword");
const toggleIconConfirm = document.getElementById("toggleIconConfirmPassword");

// Security edit page toggles
const currentPasswordSecurity = document.getElementById("current-password");
const toggleCurrentPasswordSecurity = document.getElementById(
  "toggleCurrentPassword"
);
const toggleIconCurrentSecurity = document.getElementById("toggleIconCurrent");

const newPasswordSecurity = document.getElementById("new-password");
const toggleNewPasswordSecurity = document.getElementById(
  "toggleNewPasswordSecurity"
);
const toggleIconNewSecurity = document.getElementById("toggleIconNewSecurity");

const confirmPasswordSecurity = document.getElementById("confirm-password");
const toggleConfirmPasswordSecurity = document.getElementById(
  "toggleConfirmPasswordSecurity"
);
const toggleIconConfirmSecurity = document.getElementById(
  "toggleIconConfirmSecurity"
);

// For new password in reset password form
if (toggleNewPassword) {
  toggleNewPassword.addEventListener("click", function () {
    // Toggle the input type between 'password' and 'text'
    const typeNew =
      NewPasswordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    NewPasswordInput.setAttribute("type", typeNew);
    // Toggle the icon between eye and eye-slash
    if (typeNew === "text") {
      toggleIconNewPassword.classList.remove("bi-eye");
      toggleIconNewPassword.classList.add("bi-eye-slash");
    } else {
      toggleIconNewPassword.classList.remove("bi-eye-slash");
      toggleIconNewPassword.classList.add("bi-eye");
    }
  });
}

// For confirm password in reset password form
if (togglePasswordConfirm) {
  togglePasswordConfirm.addEventListener("click", function () {
    // Toggle the input type between 'password' and 'text'
    const typeConfirm =
      passwordInputConfirm.getAttribute("type") === "password"
        ? "text"
        : "password";
    passwordInputConfirm.setAttribute("type", typeConfirm);

    // Toggle the icon between eye and eye-slash
    if (typeConfirm === "text") {
      toggleIconConfirm.classList.remove("bi-eye");
      toggleIconConfirm.classList.add("bi-eye-slash");
    } else {
      toggleIconConfirm.classList.remove("bi-eye-slash");
      toggleIconConfirm.classList.add("bi-eye");
    }
  });
}

// Security page: current password toggle
if (toggleCurrentPasswordSecurity && currentPasswordSecurity) {
  toggleCurrentPasswordSecurity.addEventListener("click", function () {
    const type =
      currentPasswordSecurity.getAttribute("type") === "password"
        ? "text"
        : "password";
    currentPasswordSecurity.setAttribute("type", type);
    if (toggleIconCurrentSecurity) {
      toggleIconCurrentSecurity.classList.toggle("bi-eye");
      toggleIconCurrentSecurity.classList.toggle("bi-eye-slash");
    }
  });
}

// Security page: new password toggle
if (toggleNewPasswordSecurity && newPasswordSecurity) {
  toggleNewPasswordSecurity.addEventListener("click", function () {
    const type =
      newPasswordSecurity.getAttribute("type") === "password"
        ? "text"
        : "password";
    newPasswordSecurity.setAttribute("type", type);
    if (toggleIconNewSecurity) {
      toggleIconNewSecurity.classList.toggle("bi-eye");
      toggleIconNewSecurity.classList.toggle("bi-eye-slash");
    }
  });
}

// Security page: confirm password toggle
if (toggleConfirmPasswordSecurity && confirmPasswordSecurity) {
  toggleConfirmPasswordSecurity.addEventListener("click", function () {
    const type =
      confirmPasswordSecurity.getAttribute("type") === "password"
        ? "text"
        : "password";
    confirmPasswordSecurity.setAttribute("type", type);
    if (toggleIconConfirmSecurity) {
      toggleIconConfirmSecurity.classList.toggle("bi-eye");
      toggleIconConfirmSecurity.classList.toggle("bi-eye-slash");
    }
  });
}

// Require new/confirm password fields when current password is filled
document.querySelector("form").addEventListener("submit", function (e) {
  const currentPassword = document.getElementById("current-password");
  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");
  if (currentPassword.value.trim() !== "") {
    if (
      newPassword.value.trim() === "" ||
      confirmPassword.value.trim() === ""
    ) {
      e.preventDefault();
      alert("Please fill in both new password and confirm password fields.");
      return false;
    }
  }
});

//Upload avatar button
const avatarUploadInput = document.getElementById("avatar-upload");
if (avatarUploadInput) {
  avatarUploadInput.addEventListener("change", function () {
    if (avatarUploadInput.files && avatarUploadInput.files.length > 0) {
      avatarUploadInput.form.submit();
    }
  });
}
