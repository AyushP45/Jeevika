import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/associations.js";

const router = express.Router();

// GET /api/notifications - Get all notifications for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50
    });
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read - Mark a notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete("/", requireAuth, async (req, res) => {
  try {
    await Notification.destroy({
      where: { userId: req.user.id }
    });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

export default router;
