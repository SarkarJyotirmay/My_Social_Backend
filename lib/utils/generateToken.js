import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


// Function to generate a JWT token
export const generateToken = async (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "1d",
  });

  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    sameSite: "Strict", // Helps prevent CSRF attacks
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
  })
}