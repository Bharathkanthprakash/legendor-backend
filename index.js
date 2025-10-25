import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import postRoutes from "./routes/posts.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.29.77:5173',
    'https://legendor-frontend.netlify.app',
    'https://legendor-frontend1.netlify.app/',
    'https://*.netlify.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-with'],
}));
app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve uploaded images/videos

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/posts", postRoutes);

app.listen(process.env.PORT || 4000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
