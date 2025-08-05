import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";


dotenv.config();

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

app.listen(8080, () => console.log("Server is up and running"));
