import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// models
import Notification from "../models/notification.model.js";

const getUserProfile = async (req, res) => {
  try {
    const { userName } = req.params;

    // Logic to fetch user profile by userName
    const user = await User.findOne({ userName: userName }).select(
      "-password -__v"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ! FollowUnfollow User
const followUnfollowUser = async (req, res) => {
  try {
    console.log(`User => ${req.user}`);

    const { id } = req.params; // User ID to follow/unfollow
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id); // Assuming req.user is set by the protectedRoute middleware

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot follow/unfollow yourself" });
    }

    // Check if the user to modify and the current user exist
    if (!userToModify || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Current User:", currentUser);
    console.log("User to modify:", userToModify);

    // Toggle follow/unfollow
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      // Unfollow
      console.log("Unfollowing user:", userToModify.userName);

      currentUser.following = currentUser.following.filter(
        (userId) => userId.toString() !== id
      );
      userToModify.followers = userToModify.followers.filter(
        (followerId) => followerId.toString() !== req.user._id.toString()
      );
      // Save both users
      await currentUser.save();
      await userToModify.save();
      return res.status(200).json({
        message: "Unfollowed successfully",
      });
    } else {
      // Follow
      console.log("Following user:", userToModify.userName);
      currentUser.following.push(id);
      userToModify.followers.push(req.user._id);

      // Save both users
      await currentUser.save();
      await userToModify.save();

      //   send notifiacation to user
      await Notification.create({
        type: "follow",
        from: currentUser._id,
        to: userToModify._id,
      });

      return res.status(200).json({
        message: "Followed successfully",
      });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ! Suggested Users
const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user is set by the protectedRoute middleware
    const usersFollowedByMe = await User.findById(userId).select("following");
    // console.log("Users followed by me:", usersFollowedByMe);

    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: userId, // Exclude current user
          },
        },
      },
      { $sample: { size: 10 } }, // Randomly sample 10 users
    ]);

    // console.log("fetched users",users);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    // console.log("Filtered suggested users:", filteredUsers);
    // pagination logic
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit)*page || page*4;
    const startIndex = 0; // as we want to show more users on clicking show more button
    const endIndex = startIndex + limit;

    // console.log("Pagination - Start Index:", startIndex, "End Index:", endIndex, "Limit:", limit, );
 
    const suggestedUsers = filteredUsers.slice(startIndex, endIndex);
    suggestedUsers.forEach((user) => {
      user.password = null;
    });

    res.json({
      success: true,
      users:suggestedUsers,
    });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ! Update User
const updateUser = async (req, res) => {
  let { fullname, email, bio, userName, link, currentPassword, newpassword } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id; // Assuming req.user is set by the protectedRoute middleware

  let user = await User.findById(userId); // latest user data
  try {
    // if user wants to update password, both current and new password must be provided
    if (
      (currentPassword && !newpassword) ||
      (!currentPassword && newpassword)
    ) {
      return res.status(400).json({
        message: "Please provide both current and new password or none.",
      });
    }

    if (currentPassword && newpassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }
      // Validate new password length
      if (newpassword.length < 4) {
        return res.status(400).json({
          message: "New password must be at least 4 characters long.",
        });
      }
      if (newpassword === currentPassword) {
        return res.status(400).json({
          message: "New password cannot be the same as current password.",
        });
      }
      user.password = await bcrypt.hash(newpassword, 10);
      console.log("Hashing of password colpleted");
    }

    if (profileImg) {
      if (user.profileImg) {
        // Delete old profile image from cloudinary
        // https://res.cloudinary.com/<your-cloud-name>/image/upload/v1723200000/profile/abcd1234xyz.jpg
        const publicId = user.profileImg
          .split("/")
          .slice(-2) // get folder + filename
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg, {
        folder: "profile",
      });
      profileImg = uploadedResponse.secure_url;
      user.profileImg = profileImg;
    }

    if (coverImg) {
      if (user.coverImg) {
        // Delete old cover image from cloudinary
        const publicId = user.coverImg
          .split("/")
          .slice(-2) // get folder + filename
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg, {
        folder: "cover",
      });
      coverImg = uploadedResponse.secure_url;
      user.coverImg = coverImg;
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.userName = userName || user.userName;
    user.link = link || user.link;
    await user.save();

    console.log("user updated successfully");

    user.password = null; // Remove password from response
    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getUserProfile, followUnfollowUser, getSuggestedUsers, updateUser };
