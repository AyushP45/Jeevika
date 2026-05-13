/**
 * Jeevika Job Verification Routes
 * ─────────────────────────────────────────────────────────
 * POST /api/verification/:jobId/start         — Worker starts work (geo check-in)
 * POST /api/verification/:jobId/before-proof  — Worker uploads before-work evidence
 * POST /api/verification/:jobId/ping          — Periodic GPS heartbeat during work
 * POST /api/verification/:jobId/complete      — Worker submits completion evidence
 * GET  /api/verification/:jobId               — Get current verification state
 * POST /api/verification/:jobId/review        — Client approves / disputes / requests rework
 * GET  /api/verification/my/active            — List worker's active verifications
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Job, User } from "../models/associations.js";
import { JobVerification } from "../models/JobVerification.js";
import { analyseVerification } from "../services/FraudDetectionService.js";
import { notificationService } from "../services/NotificationService.js";
import crypto from "crypto";

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateSubmissionHash(verificationId, workerId, timestamp) {
  return crypto
    .createHash("sha256")
    .update(`${verificationId}:${workerId}:${timestamp}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

// ── POST /api/verification/:jobId/start — Worker geo check-in ────────────────
router.post("/:jobId/start", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      lat, lng, deviceId, networkInfo,
      checkInSelfie, // base64 from in-app camera
    } = req.body;

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.workerId !== req.user.id)
      return res.status(403).json({ message: "You are not the assigned worker for this job" });
    if (job.status !== "In Progress")
      return res.status(400).json({ message: "Job is not in progress" });

    // Parse job coordinates (stored as "lat,lng" string or JSON)
    let jobLat = null, jobLng = null;
    if (job.coordinates) {
      try {
        const coords = JSON.parse(job.coordinates);
        jobLat = coords.lat ?? coords[0];
        jobLng = coords.lng ?? coords[1];
      } catch {
        const parts = job.coordinates.split(",");
        if (parts.length === 2) { jobLat = parseFloat(parts[0]); jobLng = parseFloat(parts[1]); }
      }
    }

    // GPS radius validation
    let gpsValidated = false;
    let distanceFromJobMeters = null;
    const allowedRadiusMeters = 500; // 500m default

    if (lat && lng && jobLat && jobLng) {
      distanceFromJobMeters = Math.round(haversineMeters(lat, lng, jobLat, jobLng));
      gpsValidated = distanceFromJobMeters <= allowedRadiusMeters;
    }

    // Upsert verification record
    const [verification, created] = await JobVerification.findOrCreate({
      where: { jobId, workerId: req.user.id },
      defaults: {
        clientId: job.employerId,
        jobLat, jobLng, allowedRadiusMeters,
        checkInTime: new Date(),
        checkInLat: lat, checkInLng: lng,
        checkInDeviceId: deviceId,
        checkInNetworkInfo: networkInfo ? JSON.stringify(networkInfo) : null,
        checkInSelfie,
        gpsValidated,
        distanceFromJobMeters,
        status: "checked_in"
      }
    });

    if (!created) {
      // Allow re-check-in if it was just pending
      if (verification.status !== "pending_checkin") {
        return res.status(400).json({ message: "Work session already started", verification });
      }
      await verification.update({
        checkInTime: new Date(),
        checkInLat: lat, checkInLng: lng,
        checkInDeviceId: deviceId,
        checkInNetworkInfo: networkInfo ? JSON.stringify(networkInfo) : null,
        checkInSelfie,
        gpsValidated,
        distanceFromJobMeters,
        status: "checked_in"
      });
    }

    // Notify the client that worker checked in
    const client = await User.findByPk(job.employerId);
    const worker = await User.findByPk(req.user.id);
    if (client && worker) {
      notificationService.notifyUser(
        client,
        "Worker Checked In 📍",
        `${worker.name} has arrived and started work on "${job.title}".${!gpsValidated ? " (Location mismatch detected)" : ""}`,
        "WORKER_CHECKIN",
        `/verification/${jobId}`
      );
    }

    res.json({
      success: true,
      gpsValidated,
      distanceFromJobMeters,
      verification: created ? verification : verification.reload(),
      warning: !gpsValidated && distanceFromJobMeters
        ? `Worker is ${distanceFromJobMeters}m from the job site (allowed: ${allowedRadiusMeters}m).`
        : null
    });
  } catch (err) {
    console.error("Verification start error:", err);
    res.status(500).json({ message: "Failed to start verification session" });
  }
});

// ── POST /api/verification/:jobId/before-proof ───────────────────────────────
router.post("/:jobId/before-proof", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { images = [], video, taskNotes } = req.body;

    const verification = await JobVerification.findOne({
      where: { jobId, workerId: req.user.id }
    });

    if (!verification) return res.status(404).json({ message: "No active verification session" });
    if (!["checked_in", "before_proof_submitted"].includes(verification.status)) {
      return res.status(400).json({ message: "Cannot upload before-proof in current state" });
    }

    await verification.update({
      beforeImages: images,
      beforeVideo: video || null,
      taskNotes: taskNotes || null,
      status: "before_proof_submitted"
    });

    res.json({ success: true, verification });
  } catch (err) {
    console.error("Before proof error:", err);
    res.status(500).json({ message: "Failed to upload before-work proof" });
  }
});

// ── POST /api/verification/:jobId/ping — GPS heartbeat ───────────────────────
router.post("/:jobId/ping", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { lat, lng } = req.body;

    const verification = await JobVerification.findOne({
      where: { jobId, workerId: req.user.id }
    });

    if (!verification) return res.status(404).json({ message: "No active session" });

    const newPing = { lat, lng, timestamp: new Date().toISOString() };
    const existingPings = Array.isArray(verification.gpsPings) ? verification.gpsPings : [];

    await verification.update({
      gpsPings: [...existingPings, newPing],
      status: "work_in_progress"
    });

    res.json({ success: true, pingCount: existingPings.length + 1 });
  } catch (err) {
    console.error("GPS ping error:", err);
    res.status(500).json({ message: "Failed to record GPS ping" });
  }
});

// ── POST /api/verification/:jobId/complete — Worker submits completion ────────
router.post("/:jobId/complete", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      lat, lng,
      images = [],
      video,
      voiceNote,
      completionNote,
    } = req.body;

    const job = await Job.findByPk(jobId);
    const verification = await JobVerification.findOne({
      where: { jobId, workerId: req.user.id }
    });

    if (!verification) return res.status(404).json({ message: "No active verification session" });
    if (!["checked_in", "before_proof_submitted", "work_in_progress"].includes(verification.status)) {
      return res.status(400).json({ message: "Cannot complete in current state" });
    }
    if (images.length === 0) {
      return res.status(400).json({ message: "After-work images are required to complete the job" });
    }

    const checkOutTime = new Date();
    const sessionDurationMinutes = verification.checkInTime
      ? (checkOutTime - new Date(verification.checkInTime)) / 60000
      : null;

    const submissionHash = generateSubmissionHash(verification.id, req.user.id, checkOutTime.toISOString());

    // Run AI fraud analysis
    const workerUser = await User.findByPk(req.user.id);
    const workerHistory = {
      completedJobs: workerUser?.completedJobs || 0,
      fraudFlags: 0,
      disputeRatio: 0,
      cancellationRatio: 0
    };

    const updatedVerification = {
      ...verification.toJSON(),
      checkOutTime,
      checkOutLat: lat,
      checkOutLng: lng,
      sessionDurationMinutes,
      afterImages: images,
      afterVideo: video || null,
      voiceNote: voiceNote || null,
      completionNote: completionNote || null
    };

    const aiResult = analyseVerification(updatedVerification, job?.toJSON?.() || {}, workerHistory);

    await verification.update({
      checkOutTime,
      checkOutLat: lat,
      checkOutLng: lng,
      sessionDurationMinutes,
      afterImages: images,
      afterVideo: video || null,
      voiceNote: voiceNote || null,
      completionNote: completionNote || null,
      submissionHash,
      status: "client_review",
      aiTrustScore: aiResult.trustScore,
      aiFraudProbability: aiResult.fraudProbability,
      aiConfidence: aiResult.confidence,
      aiFlags: aiResult.flags,
      aiVerdict: aiResult.verdict,
      aiAnalyzedAt: new Date()
    });

    // Update job status
    await Job.update({ status: "Completed" }, { where: { id: jobId } });

    // Notify client
    const client = await User.findByPk(job.employerId);
    const worker = await User.findByPk(req.user.id);
    if (client && worker) {
      notificationService.notifyUser(
        client,
        "Work Completed — Review Required ✅",
        `${worker.name} has submitted completion proof for "${job.title}". Please review and approve.`,
        "WORK_SUBMITTED",
        `/verification/${jobId}/review`
      );
    }

    res.json({
      success: true,
      submissionHash,
      aiResult,
      verification: await verification.reload()
    });
  } catch (err) {
    console.error("Completion error:", err);
    res.status(500).json({ message: "Failed to submit completion" });
  }
});

// ── GET /api/verification/:jobId — Get verification details ──────────────────
router.get("/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only employer or worker can view
    if (job.employerId !== req.user.id && job.workerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const verification = await JobVerification.findOne({ where: { jobId } });
    if (!verification) {
      return res.json({ verification: null, job });
    }

    const worker = await User.findByPk(verification.workerId, {
      attributes: ["id", "name", "phone", "rating", "completedJobs", "profilePhoto"]
    });
    const client = await User.findByPk(verification.clientId, {
      attributes: ["id", "name", "companyName"]
    });

    res.json({ verification, job, worker, client });
  } catch (err) {
    console.error("Verification get error:", err);
    res.status(500).json({ message: "Failed to load verification" });
  }
});

// ── POST /api/verification/:jobId/review — Client review ─────────────────────
router.post("/:jobId/review", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action, note } = req.body; // action: "approved" | "rework_requested" | "disputed"

    if (!["approved", "rework_requested", "disputed"].includes(action)) {
      return res.status(400).json({ message: "Invalid review action" });
    }

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.employerId !== req.user.id)
      return res.status(403).json({ message: "Only the client can review work" });

    const verification = await JobVerification.findOne({ where: { jobId } });
    if (!verification) return res.status(404).json({ message: "No verification found" });
    if (verification.status !== "client_review") {
      return res.status(400).json({ message: "Work is not ready for review" });
    }

    const statusMap = {
      approved: "approved",
      rework_requested: "rework_requested",
      disputed: "disputed"
    };

    await verification.update({
      clientAction: action,
      clientNote: note || null,
      clientReviewedAt: new Date(),
      status: statusMap[action]
    });

    const worker = await User.findByPk(job.workerId);
    const client = await User.findByPk(req.user.id);

    if (action === "approved") {
      // Release escrow payment automatically
      const { Transaction, User: UserModel } = await import("../models/associations.js");
      const lockedTxn = await Transaction.findOne({
        where: { jobId, status: "Locked" }
      });

      if (lockedTxn && worker) {
        await worker.update({ walletBalance: worker.walletBalance + lockedTxn.amount });
        await lockedTxn.update({ status: "Completed" });

        await Transaction.create({
          userId: worker.id,
          jobId,
          amount: lockedTxn.amount,
          type: "EscrowRelease",
          status: "Completed",
          title: `Payment Released: ${job.title}`,
          date: new Date().toISOString(),
          updatedBalance: worker.walletBalance + lockedTxn.amount
        });

        // Increment worker's completed job count
        await UserModel.update(
          { completedJobs: (worker.completedJobs || 0) + 1 },
          { where: { id: worker.id } }
        );
      }

      await Job.update({ status: "Completed", escrowStatus: "Released" }, { where: { id: jobId } });

      if (worker) {
        notificationService.notifyUser(
          worker,
          "Payment Released! 💰",
          `${client?.name || "Your client"} has approved your work on "${job.title}". Payment has been released.`,
          "PAYMENT_RELEASED",
          `/wallet`
        );
      }
    } else if (action === "rework_requested") {
      if (worker) {
        notificationService.notifyUser(
          worker,
          "Rework Requested",
          `${client?.name || "Client"} has requested changes on "${job.title}". Please review the feedback.`,
          "REWORK_REQUESTED",
          `/verification/${jobId}`
        );
      }
    } else if (action === "disputed") {
      await Job.update({ isDisputed: true }, { where: { id: jobId } });
      if (worker) {
        notificationService.notifyUser(
          worker,
          "Dispute Raised",
          `${client?.name || "Client"} has raised a dispute on "${job.title}". Escrow is frozen.`,
          "DISPUTE",
          `/verification/${jobId}`
        );
      }
    }

    res.json({ success: true, verification: await verification.reload(), action });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Failed to process review" });
  }
});

// ── GET /api/verification/my/active — Worker's active verifications ───────────
router.get("/my/active", requireAuth, async (req, res) => {
  try {
    const verifications = await JobVerification.findAll({
      where: { workerId: req.user.id },
      order: [["updatedAt", "DESC"]]
    });

    // Attach job info
    const withJobs = await Promise.all(
      verifications.map(async (v) => {
        const job = await Job.findByPk(v.jobId, {
          attributes: ["id", "title", "category", "location", "budget", "status"]
        });
        return { ...v.toJSON(), job };
      })
    );

    res.json(withJobs);
  } catch (err) {
    console.error("Active verifications error:", err);
    res.status(500).json({ message: "Failed to load verifications" });
  }
});

// ── GET /api/verification/admin/all — Admin overview ─────────────────────────
router.get("/admin/all", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const verifications = await JobVerification.findAll({
      order: [["updatedAt", "DESC"]],
      limit: 100
    });

    res.json(verifications);
  } catch (err) {
    console.error("Admin verifications error:", err);
    res.status(500).json({ message: "Failed to load verifications" });
  }
});

export default router;
