import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import notificationRoutes from "./routes/notofication.routes.js"


dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLAUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express();

// Connecting to db
mongoose
  .connect(process.env.ATLAS_CONNECTION_STR)
  .then(() => console.log("DB connected successfully"))
  .catch((e) => console.log(`Error in connecting DB => ${e}`));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Endpoints
app.get("/api/v1/health", (req, res) => {
  res.send("Server is Healthy");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.listen(8080, () => console.log("Server is up and running"));
