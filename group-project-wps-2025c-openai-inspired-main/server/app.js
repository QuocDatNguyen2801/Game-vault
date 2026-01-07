require("dotenv").config();
const { connectDB, connectDBTest } = require("./config/db");
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const SecurityQuestion = require("./models/securityQuestions");
const Product = require("./models/Product");
const { requireAdmin } = require("./middlewares/authMiddleware");

const app = express();
const path = require("path");

const PORT = process.env.PORT || 3000;
const DEFAULT_SECURITY_QUESTIONS = require("./data/securityQuestions.json");

// Seed security questions if not present
async function ensureSecurityQuestionsSeeded() {
  const count = await SecurityQuestion.estimatedDocumentCount();
  if (count > 0) return;
  await SecurityQuestion.insertMany(DEFAULT_SECURITY_QUESTIONS);
  console.log("Security questions seeded (auto)");
}

// Routes of user authentication
const userRoutes = require("./routes/user/index");
const adminDashboardRoute = require("./routes/dashboard/admin");

// Routes of user account management
const accountRoutes = require("./routes/account/index");

// Routes of others
const indexRoute = require("./routes/index");
const shopRoute = require("./routes/shopping-cart/shop");
const cartRoute = require("./routes/shopping-cart/cart");
const checkoutRoute = require("./routes/shopping-cart/checkout");
const orderConfirmationRoute = require("./routes/shopping-cart/order-confirmation");
const orderRoute = require("./routes/shopping-cart/orders");
const categoriesRoute = require("./routes/shopping-cart/categories");
const blogRoute = require("./routes/blog/blog");
const sitemapRoute = require("./routes/sitemap");

// // Session configuration (Use for sign in/sign up for now)
const SESSION_LIFETIME = 1000 * 60 * 60 * 2; // 2 hours
app.use(
  session({
    secret: process.env.SECRET || "GameVaultSecretKey2025",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: SESSION_LIFETIME / 1000, // 2 hours in seconds
    }),
    cookie: { maxAge: SESSION_LIFETIME }, // 2 hours in milliseconds
  })
);

// If behind a proxy (e.g., Render), trust it for secure cookies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Serve Static Files
app.use(express.static("public"));

// Serve Upload Files
app.use("/uploads", express.static("uploads"));

// Method Override
app.use(methodOverride("_method"));

// Cookie Parser
app.use(cookieParser());

// Logging on each request (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Don't expose "X-Powered-By" header
app.disable("x-powered-by"); //Go to DevTools > Network > Headers to verify

// Middlewares
app.use(express.json({ limit: "10mb" })); // To handle JSON payloads (Example: req.body.email)
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// Basic CORS to allow a decoupled front-end to consume APIs
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// View Templating
app.set("view engine", "ejs"); // To use files without .ejs extension
app.set("views", path.join(__dirname, "..", "views")); // Files to render
app.use(expressLayouts);
app.set("layout", "layouts/main"); // Default layout, pass specific layout in res.render to override

// For Sign In, Sign Up, Reset Password, etc.
app.use("/user", userRoutes);
app.get("/user/locked", (req, res) => {
  res.status(423).render("errors/locked", {
    layout: "layouts/login_signup_main.ejs",
    title: "Account locked",
  });
});

const User = require("./models/User");
//Expose logged-in user info to all views
app.use(async (req, res, next) => {
  const userId = req.session.userId;
  const user = userId ? await User.findById(userId).lean() : null;
  if (user && !user.isDeleted && !user.isDeactivated) {
    res.locals.currentUser = user;
  } else {
    res.locals.currentUser = null;
  }
  next();
});

// For user profile related pages
app.use("/account", accountRoutes);

// -----------------------------
// Main Application Routes
// -----------------------------
app.use("/", indexRoute);
app.use("/shop", shopRoute);
app.use("/cart", cartRoute);
app.use("/checkout", checkoutRoute);
app.use("/order-confirmation", orderConfirmationRoute);
app.use("/orders", orderRoute);
app.use("/categories", categoriesRoute);

// Blog Routes
app.use("/blog", blogRoute);

// Admin Dashboard (admin only)
app.use("/dashboard/admin", requireAdmin, adminDashboardRoute);

// Static blog detail
app.get("/blog/:slug", (req, res) => {
  const styles = `<link rel="stylesheet" href="/css/blog.css" />`;
  const scripts = "";
  res.render("blog/blog-detail", { title: "Blog", styles, scripts });
});

// -----------------------------
// Forum Module
// -----------------------------
const forumRoute = require("./routes/Forum/Forum");
app.use("/forum", forumRoute);

// Review routes
const reviewRoutes = require("./routes/reviewRoutes");
app.use(reviewRoutes);

// -----------------------------
// Sitemap
// -----------------------------
app.use("/", sitemapRoute);

async function startServer() {
  try {
    // Uncomment for production connection
    // await connectDB();

    await connectDBTest();
    await ensureSecurityQuestionsSeeded();

    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}

startServer();
