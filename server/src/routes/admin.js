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
    const activeContracts = await Job.count({ where: { status: "In Progress" } });
    
    // Sum up all wallet balances for a system-wide view
    const totalBalance = await User.sum("walletBalance") || 0;

    res.json({
      users: userCount,
      jobs: jobCount,
      activeContracts,
      totalBalance
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// GET /api/admin/jobs
router.get("/jobs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [
        { model: User, as: "employer", attributes: ["id", "name"] },
        { model: User, as: "worker", attributes: ["id", "name"] }
      ],
      order: [["createdAt", "DESC"]]
    });
    res.json(jobs);
  } catch (error) {
    console.error("Admin list jobs error:", error);
    res.status(500).json({ message: "Failed to load jobs" });
  }
});

// POST /api/admin/jobs/:id/release — Manual Escrow Release
router.post("/jobs/:id/release", requireAuth, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job || !job.workerId) return res.status(404).json({ message: "Job or assigned worker not found" });
    if (job.escrowStatus !== "Locked") return res.status(400).json({ message: "Escrow is not locked" });

    const worker = await User.findByPk(job.workerId);
    await worker.update({ walletBalance: worker.walletBalance + job.budget });
    await job.update({ escrowStatus: "Released", status: "Completed" });

    res.json({ success: true, message: "Escrow released to worker" });
  } catch (error) {
    console.error("Admin release error:", error);
    res.status(500).json({ message: "Failed to release escrow" });
  }
});

// POST /api/admin/kyc/:id/approve
router.post("/kyc/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ kycStatus: "Verified", isKycVerified: true });
    
    // Add verified badge
    const badges = user.badges || [];
    if (!badges.includes("Verified")) {
      await user.update({ badges: [...badges, "Verified"] });
    }

    res.json(user);
  } catch (error) {
    console.error("Admin kyc approve error:", error);
    res.status(500).json({ message: "Failed to approve KYC" });
  }
});

// POST /api/admin/kyc/:id/reject
router.post("/kyc/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ kycStatus: "Rejected", isKycVerified: false });
    res.json(user);
  } catch (error) {
    console.error("Admin kyc reject error:", error);
    res.status(500).json({ message: "Failed to reject KYC" });
  }
});

export default router;
