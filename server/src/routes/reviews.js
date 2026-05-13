import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Review, User, Job } from "../models/associations.js";
import { sequelize } from "../db.js";

const router = express.Router();

// POST /api/reviews — create a review
router.post("/", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { jobId, revieweeId, rating, comment, type } = req.body;
    
    // Check if review already exists
    const existing = await Review.findOne({ 
      where: { jobId, reviewerId: req.user.id, revieweeId } 
    });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ message: "You have already reviewed this user for this job" });
    }

    const review = await Review.create({
      jobId,
      reviewerId: req.user.id,
      revieweeId,
      rating,
      comment,
      type
    }, { transaction: t });

    // Update reviewee's average rating
    const reviews = await Review.findAll({ where: { revieweeId }, transaction: t });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    await User.update(
      { rating: parseFloat(avgRating.toFixed(1)) }, 
      { where: { id: revieweeId }, transaction: t }
    );

    await t.commit();
    res.status(201).json(review);
  } catch (error) {
    await t.rollback();
    console.error("Review create error:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

// GET /api/reviews/:userId — get reviews for a user
router.get("/:userId", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { revieweeId: req.params.userId },
      include: [{ model: User, as: "reviewer", attributes: ["name", "profilePhoto"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

export default router;
