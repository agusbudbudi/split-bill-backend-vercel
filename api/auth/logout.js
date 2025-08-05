import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { verifyRefreshToken } from "../middleware/auth.js";
import initMiddleware from "../../lib/init-middleware.js";

dotenv.config();

// Initialize CORS middleware
const corsMiddleware = initMiddleware(
  cors({
    origin: true,
    credentials: true,
  })
);

// Connect to MongoDB
const connectDB = async () => {
  if (!mongoose.connection.readyState) {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
  }
};

export default async function handler(req, res) {
  // Apply CORS
  await corsMiddleware(req, res);

  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    await connectDB();

    const { refreshToken } = req.body;

    // Validate refresh token if provided
    if (refreshToken) {
      try {
        verifyRefreshToken(refreshToken);
      } catch (error) {
        // Token is invalid, but we still proceed with logout
        console.log("Invalid refresh token during logout:", error.message);
      }
    }

    // In a production app, you might want to:
    // 1. Add the refresh token to a blacklist
    // 2. Store refresh tokens in database and remove them
    // For now, we'll just return success since the frontend will clear tokens

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
