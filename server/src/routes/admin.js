import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { User, Job } from "../models/associations.js";

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

// GET /api/admin/users
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]]
    });
    res.json(users);
  } catch (error) {
    console.error("Admin list users error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// PUT /api/admin/suspend
router.put("/suspend", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = isActive;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Admin suspend user error:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userCount = await User.count();
    const jobCount = await Job.count();
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// POST /api/admin/verify/:id/approve
router.post("/verify/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verificationStatus = "Verified";
    // Add verified badge if not already there
    const badges = user.badges || [];
    if (!badges.includes("Verified")) {
      user.badges = [...badges, "Verified"];
    }
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Admin verify approve error:", error);
    res.status(500).json({ message: "Failed to approve verification" });
  }
});

// POST /api/admin/verify/:id/reject
router.post("/verify/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verificationStatus = "Rejected";
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Admin verify reject error:", error);
    res.status(500).json({ message: "Failed to reject verification" });
  }
});

export default router;
