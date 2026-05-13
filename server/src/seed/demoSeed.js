import bcrypt from "bcryptjs";
import { Job, Transaction, User } from "../models/associations.js";

/**
 * Seeds demo data into PostgreSQL if tables are empty.
 * Called once on server startup — safe to call multiple times.
 */
export async function seedDemoData() {
  console.log("Checking for demo data...");
  const passwordHash = await bcrypt.hash("jeevika123", 10);

  // ── Demo Users (findOrCreate to avoid conflicts with existing accounts) ──
  const [worker] = await User.findOrCreate({
    where: { phone: "+919876543210" },
    defaults: {
      name: "Asha Jadhav",
      role: "worker",
      email: "asha@jeevika.demo",
      passwordHash,
      location: "Kolhapur, Maharashtra",
      upi: "asha@upi",
      skills: ["Painter", "Farm Labor", "Housekeeping"],
      experience: "5 years",
      badges: ["Verified", "Top Rated", "Trusted"],
      rating: 4.8,
      completedJobs: 48,
      walletBalance: 18650
    }
  });

  const [employer] = await User.findOrCreate({
    where: { phone: "+919812345678" },
    defaults: {
      name: "Suresh Patil",
      role: "employer",
      email: "suresh@jeevika.demo",
      companyName: "Patil Farms",
      passwordHash,
      location: "Shirol, Kolhapur",
      upi: "patilfarms@upi",
      badges: ["Verified"],
      rating: 4.7,
      completedJobs: 12,
      walletBalance: 45000
    }
  });

  const [employer2] = await User.findOrCreate({
    where: { phone: "+919800001111" },
    defaults: {
      name: "Meera Joshi",
      role: "employer",
      email: "meera@jeevika.demo",
      passwordHash,
      location: "Kothrud, Pune",
      upi: "meera@upi",
      badges: ["Verified"],
      rating: 4.9,
      completedJobs: 6,
      walletBalance: 22000
    }
  });

  // ── Demo Jobs ────────────────────────────────────────
  const jobs = await Job.bulkCreate([
    {
      title: "10 workers for sugarcane harvesting",
      description: "Need experienced farm workers for cutting, loading, and field cleanup. Tools and transport provided on-site.",
      type: "Labor",
      category: "Harvesting",
      location: "Shirol village, Kolhapur",
      budget: 18500,
      duration: "3 days",
      employerId: employer.id,
      workerId: worker.id,
      applicants: [worker.id],
      status: "In Progress",
      escrowStatus: "Locked"
    },
    {
      title: "Tractor with operator for plowing",
      description: "One 45HP+ tractor required for two-acre plowing before Friday. Diesel provided.",
      type: "Equipment",
      category: "Tractor",
      location: "Hatkanangale, Kolhapur",
      budget: 6200,
      duration: "1 day",
      employerId: employer.id,
      workerId: worker.id,
      applicants: [worker.id],
      status: "Completed",
      escrowStatus: "Locked"
    },
    {
      title: "Paint and brushes for 2BHK renovation",
      description: "Premium washable paint, primer, rollers, brushes, masking tape. Same-day delivery preferred.",
      type: "Material",
      category: "Paint",
      location: "Kothrud, Pune",
      budget: 14500,
      duration: "Delivery today",
      employerId: employer2.id,
      applicants: [],
      status: "Open",
      escrowStatus: "Optional"
    },
    {
      title: "Experienced plumber for apartment repair",
      description: "Kitchen sink leakage and bathroom tap replacement. Materials will be reimbursed separately.",
      type: "Labor",
      category: "Plumber",
      location: "Indiranagar, Bengaluru",
      budget: 2400,
      duration: "4 hours",
      employerId: employer2.id,
      applicants: [worker.id],
      status: "Open",
      escrowStatus: "Ready"
    },
    {
      title: "Scaffolding rental for exterior painting",
      description: "Safe scaffolding setup for G+2 house painting project. Must include setup and dismantle.",
      type: "Equipment",
      category: "Scaffolding",
      location: "Karveer, Kolhapur",
      budget: 9000,
      duration: "5 days",
      employerId: employer.id,
      applicants: [],
      status: "Open",
      escrowStatus: "Optional"
    }
  ]);

  // ── Demo Transactions ────────────────────────────────
  await Transaction.bulkCreate([
    {
      userId: worker.id,
      jobId: jobs[0].id,
      title: "Harvesting escrow locked",
      amount: 18500,
      status: "Locked",
      autoReleaseAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    },
    {
      userId: worker.id,
      jobId: jobs[3].id,
      title: "Plumbing advance received",
      amount: 1200,
      status: "Released"
    },
    {
      userId: employer.id,
      jobId: jobs[1].id,
      title: "Tractor escrow locked",
      amount: 6200,
      status: "Locked",
      autoReleaseAt: new Date(Date.now() + 32 * 60 * 60 * 1000)
    }
  ]);

  console.log("✅ Demo data seeded: 3 users, 5 jobs, 3 transactions");
  console.log("   Demo login: +919876543210 / jeevika123 (worker)");
  console.log("   Demo login: +919812345678 / jeevika123 (employer)");
}
