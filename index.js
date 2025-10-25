import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import postRoutes from "./routes/posts.js";
try {
  const authRoutes = await import("./routes/auth.js");
  console.log("✅ auth.js loaded");
} catch (e) {
  console.log("❌ auth.js failed to load:", e.message);
}


dotenv.config();
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.29.77:5173',
    'https://legendor-frontend.netlify.app',
    'https://legendor-frontend1.netlify.app',
    'https://legendor.in',
    'https://www.legender.in',
    'https://*.netlify.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/posts", postRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "legendor-backend",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Legendor Backend API is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      profiles: "/api/profiles",
      posts: "/api/posts"
    }
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health endpoint: http://0.0.0.0:${PORT}/health`);
});
