import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Job, Transaction, User } from "../models/associations.js";
import { sequelize } from "../db.js";
import { notificationService } from "../services/NotificationService.js";

const router = express.Router();

// GET /api/wallet/transactions
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({ 
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]] 
    });

    const mapped = transactions.map(t => {
      const j = t.toJSON();
      // Format date nicely e.g., "May 12" or "Today"
      const date = new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        ...j,
        date: date
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error("Wallet transactions error:", error);
    res.status(500).json({ message: "Failed to load transactions" });
  }
});

// POST /api/wallet/escrow/lock
router.post("/escrow/lock", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { jobId, amount, title } = req.body;
    const user = await User.findByPk(req.user.id, { transaction: t });

    if (user.walletBalance < amount) {
      await t.rollback();
      return res.status(400).json({ message: "Insufficient balance for escrow lock" });
    }

    // Deduct from wallet
    user.walletBalance -= amount;
    await user.save({ transaction: t });

    // Update job status
    if (jobId) {
      const { workerId } = req.body;
      await Job.update({ 
        escrowStatus: "Locked", 
        workerId: workerId || null 
      }, { where: { id: jobId }, transaction: t });
    }

    // Create transaction record
    const txn = await Transaction.create({
      userId: req.user.id,
      jobId: jobId || null,
      title: title || "Escrow locked",
      amount: amount,
      status: "Locked",
      autoReleaseAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    }, { transaction: t });

    await t.commit();
    
    // Trigger Notifications (Phase 1)
    try {
      await notificationService.notifyUser(
        user, 
        "Escrow Secured: " + (title || "Demo Escrow Locked"), 
        `Great news! An amount of ₹${amount} has been successfully locked in Jeevika's safe escrow. This guarantees your payment once the work is completed.`,
        "ESCROW",
        "/wallet"
      );
    } catch (e) {
      console.error("Non-fatal notification error:", e);
    }

    // Format date for frontend
    const date = new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    res.status(201).json({ ...txn.toJSON(), date, updatedBalance: user.walletBalance });
  } catch (error) {
    await t.rollback();
    console.error("Escrow lock error:", error);
    res.status(500).json({ message: "Failed to lock escrow" });
  }
});

// POST /api/wallet/escrow/:id/release
router.post("/escrow/:id/release", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const txn = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id }, transaction: t });
    
    if (!txn) {
      await t.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (txn.status !== "Locked") {
      await t.rollback();
      return res.status(400).json({ message: "Transaction is not locked" });
    }

    // Mark as Released
    txn.status = "Released";
    await txn.save({ transaction: t });

    if (txn.jobId) {
      await Job.update({ escrowStatus: "Released", status: "Completed" }, { where: { id: txn.jobId }, transaction: t });
      
      const job = await Job.findByPk(txn.jobId, { transaction: t });
      if (job && job.workerId) {
        const worker = await User.findByPk(job.workerId, { transaction: t });
        if (worker) {
          worker.completedJobs += 1;
          worker.walletBalance += txn.amount;
          
          // Milestone Badges
          const badges = worker.badges || [];
          if (worker.completedJobs >= 5 && !badges.includes("Reliable")) {
            badges.push("Reliable");
          }
          if (worker.completedJobs >= 10 && !badges.includes("Expert")) {
            badges.push("Expert");
          }
          worker.badges = badges;
          
          await worker.save({ transaction: t });
        }
      }
    }

    await t.commit();

    // Fire Release Notification
    try {
      const user = await User.findByPk(req.user.id);
      await notificationService.notifyUser(
        user, 
        "Payment Released: ₹" + txn.amount, 
        `Your employer has released the escrow. ₹${txn.amount} has been added to your available Jeevika Wallet balance. You can withdraw to UPI instantly!`,
        "ESCROW",
        "/wallet"
      );
    } catch (e) {
      console.error("Non-fatal notification error:", e);
    }

    res.json({ ...txn.toJSON(), date: new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
  } catch (error) {
    await t.rollback();
    console.error("Escrow release error:", error);
    res.status(500).json({ message: "Failed to release escrow" });
  }
});

// POST /api/wallet/escrow/:id/refund
router.post("/escrow/:id/refund", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const txn = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id }, transaction: t });
    
    if (!txn) {
      await t.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (txn.status !== "Locked") {
      await t.rollback();
      return res.status(400).json({ message: "Transaction is not locked" });
    }

    // Refund to wallet
    const user = await User.findByPk(req.user.id, { transaction: t });
    user.walletBalance += txn.amount;
    await user.save({ transaction: t });

    // Mark as Refunded
    txn.status = "Refunded";
    await txn.save({ transaction: t });

    if (txn.jobId) {
      await Job.update({ escrowStatus: "Refunded" }, { where: { id: txn.jobId }, transaction: t });
    }

    await t.commit();
    res.json({ ...txn.toJSON(), date: new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), updatedBalance: user.walletBalance });
  } catch (error) {
    await t.rollback();
    console.error("Escrow refund error:", error);
    res.status(500).json({ message: "Failed to refund escrow" });
  }
});

// POST /api/wallet/deposit — Add funds to wallet (Simulated)
router.post("/deposit", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const user = await User.findByPk(req.user.id, { transaction: t });
    user.walletBalance += amount;
    await user.save({ transaction: t });

    const txn = await Transaction.create({
      userId: req.user.id,
      title: "Deposit via UPI",
      amount: amount,
      status: "Completed",
      type: "Deposit"
    }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      updatedBalance: user.walletBalance,
      transaction: {
        ...txn.toJSON(),
        date: new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    });
  } catch (error) {
    await t.rollback();
    console.error("Deposit error:", error);
    res.status(500).json({ message: "Deposit failed" });
  }
});

export default router;
