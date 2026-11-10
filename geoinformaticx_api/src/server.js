require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "").split(","),
  ...(process.env.DASHBOARD_URL || "").split(","),
  "http://localhost:3000",
  "http://localhost:3001",
]
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/(geoinformaticx-dashboard|local-for-vocal).*\.vercel\.app$/.test(
          origin,
        );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
const upload = require("./middlewares/upload");

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"))); // old files, keep
app.use("/images", express.static(upload.imageDir, { maxAge: "30d" }));

const { sequelize } = require("./models");

app.use("/api", require("./routes"));

app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.path}` }),
);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

sequelize.authenticate().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Geoinformaticx API → http://localhost:${PORT}`),
  );
});
