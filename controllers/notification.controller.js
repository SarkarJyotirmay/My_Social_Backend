import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ to: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "from",
        select: "-password -__v ",
      });

    for (let notification of notifications) {
      notification.read = true;
      await notification.save();
    }

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

export const deleteNotofications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });
    res.json({
      success: true,
      message: "All notifications deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
    });
  }
};

export const deleteNotofication = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    await Notification.findByIdAndDelete(notificationId);
    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
