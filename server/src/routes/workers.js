import express from "express";
import { Op } from "sequelize";
import { User } from "../models/associations.js";

const router = express.Router();

// GET /api/workers — find workers by skill or location
router.get("/", async (req, res) => {
  try {
    const { q, skill, location } = req.query;
    const where = { 
      role: "worker",
      isActive: true 
    };

    if (skill) {
      where.skills = { [Op.contains]: [skill] };
    }

    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
        { experience: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const workers = await User.findAll({
      where,
      attributes: ["id", "name", "location", "skills", "experience", "profilePhoto", "rating", "badges", "completedJobs", "availability"],
      order: [["rating", "DESC"]]
    });

    res.json(workers);
  } catch (error) {
    console.error("Workers list error:", error);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

// GET /api/workers/:id — get single worker profile
router.get("/:id", async (req, res) => {
  try {
    const worker = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "location", "skills", "experience", "profilePhoto", "rating", "badges", "completedJobs", "availability", "verificationStatus", "workSamples"]
    });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (error) {
    console.error("Worker profile error:", error);
    res.status(500).json({ message: "Failed to fetch worker profile" });
  }
});

export default router;
