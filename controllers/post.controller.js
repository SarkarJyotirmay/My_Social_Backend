import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import { v2 as cloudinary } from "cloudinary";
import dayjs from "dayjs";

import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(relativeTime);

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { text, img } = req.body;

    const userId = req.user._id.toString();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!text && !img) {
      return res.status(400).json({ message: "Text or image is required" });
    }

    // If an image is provided, upload it to Cloudinary
    let uploadedImg = null;
    if (img) {
      const uploadResponse = await cloudinary.uploader.upload(img, {
        folder: "posts",
      });
       uploadedImg = uploadResponse.secure_url;
    }

    const newPost = await Post.create({
      user: userId,
      text,
      img: uploadedImg || null,
      likes: [],
      comments: [],
    });

    res.json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (
      post.user.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }
    if (post.img) {
      // https://res.cloudinary.com/<your-cloud-name>/image/upload/v1723200000/posts/abcd1234xyz.jpg
      const publicId = post.img
        .split("/")
        .slice(-2) // get folder + filename
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    await Post.findByIdAndDelete(postId);
    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Comment on a post
export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id.toString();
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
    }
    const newComment = {
      user: userId,
      text: comment,
    };
    post.comments.push(newComment);
    await post.save();
    res.json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error commenting on post:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Like a post
export const likeUnlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(userId)) {
      // Unlike post
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
      await post.save();
      // Remove the user from likedPosts in User model
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      // TODO Remove notification if exists
      return res.json({
        success: true,
        message: "Post unliked successfully",
        likesCount: post.likes.length,
        updatedLikes: post.likes,
      });
    } else {
      // User has not liked the post, so we will like it
      post.likes.push(userId);
      user.likedPosts.push(postId);
      await user.save();
      await post.save();
      //   send noitification to the post owner
      await Notification.create({
        from: userId,
        to: post.user,
        type: "like",
      });
      return res.json({
        success: true,
        message: "Post liked successfully",
        likesCount: post.likes.length,
        updatedLikes: post.likes,
      });
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all posts
export const getAllPosts = async (req, res) => {
  try {
    // Fetch all posts from the database
    // Populate user and comments with user details
    // Sort posts by creation date in descending order

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -__v",
      })
      .populate({
        path: "comments.user",
        select: "-password -__v",
      });
    // format updated time
    const postsWithFormatted = posts.map((post) => {
      const obj = post.toObject(); // make plain JS object
      obj.updatedAtFormatted = dayjs(post.updatedAt).fromNow();
      return obj;
    });

    if (posts.length === 0) {
      return res.json({
        success: true,
        message: "No posts found",
        posts: [],
      });
    }
    res.json({
      success: true,
      posts: postsWithFormatted,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all liked posts for a user
export const getLikedPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    }).populate({
      path: "user",
      select: "-password -__v",
    });

    const postsWithFormatted = likedPosts.map((post) => {
      const obj = post.toObject(); // make plain JS object
      obj.updatedAtFormatted = dayjs(post.updatedAt).fromNow();
      return obj;
    });

    res.json({
      success: true,
      posts: postsWithFormatted,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get posts of followed users
export const getFollowedUserPosts = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingUsers = user.following;
    const feedPosts = await Post.find({ user: { $in: followingUsers } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -__v",
      })
      .populate({
        path: "comments.user",
        select: "-password -__v",
      });

      const postsWithFormatted = feedPosts.map((post) => {
      const obj = post.toObject(); // make plain JS object
      obj.updatedAtFormatted = dayjs(post.updatedAt).fromNow();
      return obj;
    });

    res.json({
      success: true,
      posts: postsWithFormatted,
    });
  } catch (error) {}
};

// Get posts of a specific user
export const getUserPosts = async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -__v",
      })
      .populate({
        path: "comments.user",
        select: "-password -__v",
      });

      const postsWithFormatted = posts.map((post) => {
      const obj = post.toObject(); // make plain JS object
      obj.updatedAtFormatted = dayjs(post.updatedAt).fromNow();
      return obj;
    });


    res.json({
      success: true,
      posts: postsWithFormatted,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
