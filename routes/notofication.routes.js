import express from  "express"

import { protectedRoute } from "../middlewares/protectedRoute.js"
import { getNotifications, deleteNotofications, deleteNotofication } from "../controllers/notification.controller.js" 

const router = express.Router()

router.get("/", protectedRoute, getNotifications);
router.delete("/delete-one/:notificationId", protectedRoute, deleteNotofication);
router.delete("/delete-all", protectedRoute, deleteNotofications);

export default router