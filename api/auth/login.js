import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import User from "../models/User.js";
import { generateTokens } from "../middleware/auth.js";
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

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
