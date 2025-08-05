import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { authenticateToken } from "../middleware/auth.js";
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

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    await connectDB();

    // Use authentication middleware
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    // If we reach here, authentication was successful
    // req.user is set by the authenticateToken middleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    // If it's an authentication error, it's already handled by middleware
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
