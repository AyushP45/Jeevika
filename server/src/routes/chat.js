import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Chat, User, Job } from "../models/associations.js";

const router = express.Router();

// GET /api/chat/:jobId
router.get("/:jobId", requireAuth, async (req, res) => {
  try {
    const messages = await Chat.findAll({
      where: { jobId: req.params.jobId },
      include: [{ model: User, as: "sender", attributes: ["id", "name"] }],
      order: [["createdAt", "ASC"]]
    });
    
    // Check job to get job title and employer info
    const job = await Job.findByPk(req.params.jobId, {
      include: [{ model: User, as: "employer", attributes: ["id", "name", "rating", "companyName"] }]
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      job: {
        id: job.id,
        title: job.title,
        employerId: job.employerId,
        workerId: job.workerId,
        employerName: job.employer?.companyName || job.employer?.name,
        budget: job.budget,
        location: job.location,
        escrowStatus: job.escrowStatus,
        rating: job.employer?.rating
      },
      messages: messages.map(m => ({
        id: m.id,
        sender: m.senderId === req.user.id ? "You" : m.sender.name,
        text: m.text,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error("Chat fetch error:", error);
    res.status(500).json({ message: "Failed to load chat" });
  }
});

// POST /api/chat/:jobId
router.post("/:jobId", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Chat.create({
      jobId: req.params.jobId,
      senderId: req.user.id,
      text: text.trim()
    });

    const fullMessage = await Chat.findByPk(message.id, {
      include: [{ model: User, as: "sender", attributes: ["id", "name"] }]
    });

    // Notify recipient via Socket.io
    const io = req.app.get("io");
    if (io) {
      const job = await Job.findByPk(req.params.jobId);
      if (job) {
        const recipientId = req.user.id === job.employerId ? job.workerId : job.employerId;
        if (recipientId) {
          io.to(recipientId).emit("new_message", {
            jobId: job.id,
            message: {
              id: fullMessage.id,
              sender: fullMessage.sender.name,
              text: fullMessage.text,
              createdAt: fullMessage.createdAt
            }
          });
        }
      }
    }

    res.status(201).json({
      id: message.id,
      sender: "You",
      text: message.text,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error("Chat send error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
