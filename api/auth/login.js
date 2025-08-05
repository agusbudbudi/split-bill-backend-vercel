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
  try {
    // Apply CORS
    await corsMiddleware(req, res);

    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Check environment variables
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI environment variable is not set");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({
        success: false,
        error: "Authentication configuration error",
      });
    }

    await connectDB();

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    console.log("Attempting login for email:", email);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    console.log("User found, checking password...");

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    console.log("Password valid, generating tokens...");

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    console.log("Login successful for user:", email);

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
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // More specific error handling
    if (error.name === "MongooseError" || error.name === "MongoError") {
      return res.status(500).json({
        success: false,
        error: "Database connection error",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
}
