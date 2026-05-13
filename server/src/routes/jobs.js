import express from "express";
import { Op } from "sequelize";
import { requireAuth } from "../middleware/auth.js";
import { Job, User, Bid } from "../models/associations.js";
import { notificationService } from "../services/NotificationService.js";

const router = express.Router();

// GET /api/jobs — list jobs with optional filters
router.get("/", async (req, res) => {
  try {
    // 1. Base filter: Always show Open jobs
    let userWhere = { status: "Open" };
    
    // Check if we have a token/user (simple check since this route is public)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const { id } = (await import("jsonwebtoken")).default.verify(token, process.env.JWT_SECRET || "dev-secret");
        if (id) {
          // If logged in, show Open jobs + my In Progress/Completed jobs
          userWhere = {
            [Op.or]: [
              { status: "Open" },
              { [Op.and]: [{ status: ["In Progress", "Completed"] }, { [Op.or]: [{ employerId: id }, { workerId: id }] }] }
            ]
          };
        }
      } catch (e) { /* invalid token, stick to public Open jobs */ }
    }

    const where = userWhere;
    if (req.query.type && req.query.type !== "All") where.type = req.query.type;
    if (req.query.category) {
      where.category = { [Op.iLike]: `%${req.query.category}%` };
    }
    if (req.query.q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${req.query.q}%` } },
        { category: { [Op.iLike]: `%${req.query.q}%` } },
        { location: { [Op.iLike]: `%${req.query.q}%` } }
      ];
    }
    const jobs = await Job.findAll({
      where,
      include: [
        { model: User, as: "employer", attributes: ["id", "name", "rating", "location", "badges", "companyName", "phone"] },
        { model: User, as: "worker", attributes: ["id", "name", "rating", "location"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Map to a frontend-friendly shape
    const mapped = jobs.map((job) => {
      const j = job.toJSON();
      return {
        ...j,
        employer: j.employer?.companyName || j.employer?.name || "Unknown",
        employerPhone: j.employer?.phone || "Hidden",
        postedBy: j.employer?.name || "Unknown",
        rating: j.employer?.rating || 4.5,
        applicants: Array.isArray(j.applicants) ? j.applicants.length : 0,
        escrow: j.escrowStatus || "Optional",
        distance: "Nearby"
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error("Jobs list error:", error);
    res.status(500).json({ message: "Failed to load jobs" });
  }
});

// POST /api/jobs — create a new job (auth required)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { lockBudgetNow, budget } = req.body;
    const jobData = { ...req.body, employerId: req.user.id };
    
    // 1. Handle Immediate Escrow if requested
    if (lockBudgetNow) {
      const employer = await User.findByPk(req.user.id);
      if (!employer || employer.walletBalance < budget) {
        return res.status(400).json({ message: "Insufficient balance for immediate escrow" });
      }
      
      await employer.update({ walletBalance: employer.walletBalance - budget });
      jobData.escrowStatus = "Locked";
    }

    const job = await Job.create(jobData);
    
    // 2. Create Transaction if locked
    if (lockBudgetNow) {
      const { Transaction } = await import("../models/associations.js");
      await Transaction.create({
        userId: req.user.id,
        jobId: job.id,
        amount: budget,
        type: "EscrowLock",
        status: "Locked",
        title: `Pre-funded Escrow: ${job.title}`,
        date: new Date().toISOString(),
        updatedBalance: (await User.findByPk(req.user.id)).walletBalance
      });
    }

    // 3. Notify the Employer
    const employer = await User.findByPk(req.user.id);
    if (employer) {
      notificationService.notifyUser(
        employer,
        "Job Posted Successfully",
        `Your job "${job.title}" is now live and visible to workers.`,
        "JOB_POSTED",
        `/jobs/${job.id}`
      );
    }

    // 2. Notify Workers with matching skills
    if (job.category) {
      const matchingWorkers = await User.findAll({
        where: {
          role: "worker",
          skills: { [Op.contains]: [job.category] },
          id: { [Op.ne]: req.user.id } // Don't notify the poster
        }
      });

      for (const worker of matchingWorkers) {
        notificationService.notifyUser(
          worker,
          "New Opportunity!",
          `A new job "${job.title}" matching your skill "${job.category}" was just posted in ${job.location}.`,
          "MATCHING_JOB",
          `/jobs/${job.id}`
        );
      }
    }

    res.status(201).json(job);
  } catch (error) {
    console.error("Job create error:", error);
    res.status(500).json({ message: "Failed to create job" });
  }
});

// POST /api/jobs/:id/interested — express interest/bid in a job (auth required)
router.post("/:id/interested", requireAuth, async (req, res) => {
  try {
    const { amount, message } = req.body;
    const jobId = req.params.id;
    
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    
    // Create or update bid
    const [bid, created] = await Bid.findOrCreate({
      where: { jobId, workerId: req.user.id },
      defaults: { amount: amount || job.budget, message }
    });

    if (!created) {
      bid.amount = amount || job.budget;
      bid.message = message;
      await bid.save();
    }

    // Update job applicants array (legacy support)
    const applicants = job.applicants || [];
    if (!applicants.includes(req.user.id)) {
      job.applicants = [...applicants, req.user.id];
      await job.save();
    }

    // Notify the Employer about the new interest/bid
    const employer = await User.findByPk(job.employerId);
    const worker = await User.findByPk(req.user.id);
    
    if (employer && worker) {
      notificationService.notifyUser(
        employer,
        "New Bid Received!",
        `${worker.name} has placed a bid of ₹${bid.amount} on your job: "${job.title}".`,
        "JOB_INTEREST",
        `/jobs/${job.id}`
      );
    }
    
    res.json({ success: true, bid });
  } catch (error) {
    console.error("Bid/Interest error:", error);
    res.status(500).json({ message: "Failed to place bid" });
  }
});

// GET /api/jobs/:id — get single job details (with bids if employer)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        { model: User, as: "employer", attributes: ["id", "name", "rating", "location", "badges", "companyName", "phone"] },
        { model: User, as: "worker", attributes: ["id", "name", "rating", "phone"] }
      ]
    });
    
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isEmployer = job.employerId === req.user.id;
    let bids = [];
    
    if (isEmployer) {
      bids = await Bid.findAll({
        where: { jobId: job.id },
        include: [{ model: User, as: "worker", attributes: ["id", "name", "rating", "location", "badges"] }]
      });
    }

    res.json({ 
      ...job.toJSON(), 
      bids,
      employer: job.employer?.companyName || job.employer?.name || "Unknown",
      employerPhone: job.employer?.phone || "Hidden"
    });
  } catch (error) {
    console.error("Job details error:", error);
    res.status(500).json({ message: "Failed to load job details" });
  }
});

// POST /api/jobs/:id/hire — hire a worker and lock escrow
router.post("/:id/hire", requireAuth, async (req, res) => {
  try {
    const { workerId, amount } = req.body;
    const jobId = req.params.id;

    const job = await Job.findByPk(jobId);
    const employer = await User.findByPk(req.user.id);
    const worker = await User.findByPk(workerId);

    if (!job || !employer || !worker) return res.status(404).json({ message: "Entity not found" });
    if (job.employerId !== req.user.id) return res.status(403).json({ message: "Only the employer can hire" });
    if (job.workerId) return res.status(400).json({ message: "Job already assigned" });

    const hireAmount = amount || job.budget;

    if (employer.walletBalance < hireAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance to lock escrow" });
    }

    // atomic updates would be better, but for MVP:
    await employer.update({ walletBalance: employer.walletBalance - hireAmount });
    await job.update({ 
      workerId, 
      escrowStatus: "Locked",
      status: "In Progress",
      budget: hireAmount // update budget if bid was different
    });

    // Create Transaction record
    const { Transaction } = await import("../models/associations.js");
    await Transaction.create({
      userId: employer.id,
      jobId: job.id,
      amount: hireAmount,
      type: "EscrowLock",
      status: "Locked",
      title: `Escrow Locked for: ${job.title}`,
      date: new Date().toISOString(),
      updatedBalance: employer.walletBalance
    });

    // Update Bid status
    await Bid.update({ status: "Accepted" }, { where: { jobId, workerId } });

    // Notify Worker
    notificationService.notifyUser(
      worker,
      "You've been HIRED!",
      `Employer ${employer.name} has hired you for "${job.title}". ₹${hireAmount} is locked in escrow.`,
      "HIRED",
      `/active-contracts`
    );

    res.json({ success: true, job });
  } catch (error) {
    console.error("Hiring error:", error);
    res.status(500).json({ message: "Failed to complete hiring" });
  }
});

// POST /api/jobs/:id/dispute — flag a job for dispute
router.post("/:id/dispute", requireAuth, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    job.isDisputed = true;
    await job.save();

    // Notify the other party and admin
    const otherUserId = req.user.id === job.employerId ? job.workerId : job.employerId;
    const otherUser = otherUserId ? await User.findByPk(otherUserId) : null;
    
    if (otherUser) {
      notificationService.notifyUser(
        otherUser,
        "Job Disputed",
        `The job "${job.title}" has been flagged for dispute. Escrow release is paused until resolved.`,
        "DISPUTE",
        `/jobs/${job.id}`
      );
    }
    
    res.json({ success: true, job });
  } catch (error) {
    console.error("Dispute error:", error);
    res.status(500).json({ message: "Failed to flag job" });
  }
});

// PUT /api/jobs/:id/status — update job status (e.g., In Progress -> Completed)
router.put("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByPk(req.params.id);
    
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    // Only parties involved can change status
    if (job.employerId !== req.user.id && job.workerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    job.status = status;
    await job.save();

    // Notify the other party
    const otherUserId = req.user.id === job.employerId ? job.workerId : job.employerId;
    const otherUser = otherUserId ? await User.findByPk(otherUserId) : null;
    const sender = await User.findByPk(req.user.id);

    if (otherUser && sender) {
      notificationService.notifyUser(
        otherUser,
        `Job Status Update: ${status}`,
        `${sender.name} has marked the job "${job.title}" as ${status}.`,
        "JOB_STATUS_CHANGE",
        `/active-contracts`
      );
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;
