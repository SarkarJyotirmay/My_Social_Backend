import express from "express";

import { createPost, deletePost, likeUnlikePost, commentOnPost, getAllPosts, getLikedPosts, getFollowedUserPosts, getUserPosts } from "../controllers/post.controller.js";
import { protectedRoute } from "../middlewares/protectedRoute.js";

const router = express.Router()

router.post("/create", protectedRoute, createPost)
router.get("/allposts", protectedRoute, getAllPosts)
router.get("/following", protectedRoute, getFollowedUserPosts)
router.get("/user-posts/:userName", protectedRoute, getUserPosts)

router.delete("/delete/:postId", protectedRoute, deletePost)
router.post("/comment/:postId", protectedRoute, commentOnPost)
// ToDo Update and delete comment
router.post("/like/:postId", protectedRoute, likeUnlikePost)
router.get("/all-liked-posts/:userId", protectedRoute, getLikedPosts)

export default router;