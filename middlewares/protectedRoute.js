import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized access. No token provided.",
      });
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If token is invalid or expired, decoded will be null
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized access. Invalid token.",
      });
    }

    const user = await User.findById(decoded.userId).select("-password"); // Exclude password from the user object
    // If user not found, return an error
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`Error in protectedRoute middleware: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
