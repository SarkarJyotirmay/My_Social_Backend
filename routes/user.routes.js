import express from "express";
import { protectedRoute } from "../middlewares/protectedRoute.js";
import { getUserProfile, followUnfollowUser,getSuggestedUsers, updateUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:userName", protectedRoute, getUserProfile);
router.get("/suggested", protectedRoute, getSuggestedUsers);
router.post("/follow/:id", protectedRoute, followUnfollowUser);
router.post("/update", protectedRoute, updateUser);

export default router;