import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { sequelize } from "./db.js";
import { setupAssociations } from "./models/associations.js";
import { seedDemoData } from "./seed/demoSeed.js";
import { notificationService } from "./services/NotificationService.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import walletRoutes from "./routes/wallet.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import notificationRoutes from "./routes/notifications.js";
import workerRoutes from "./routes/workers.js";
import reviewRoutes from "./routes/reviews.js";

dotenv.config({ path: "server/.env" });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Attach io to app for use in routes/services
app.set("io", io);
notificationService.setIo(io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room.`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "jeevika-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/reviews", reviewRoutes);

const port = process.env.PORT || 4000;

setupAssociations();

// Pre-sync: safely add 'admin' to the role ENUM (Sequelize alter:true can't modify ENUMs)
async function ensureEnumValues() {
  try {
    await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'admin';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_type" ADD VALUE IF NOT EXISTS 'Deposit';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_type" ADD VALUE IF NOT EXISTS 'Withdrawal';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_type" ADD VALUE IF NOT EXISTS 'EscrowLock';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_type" ADD VALUE IF NOT EXISTS 'EscrowRelease';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_type" ADD VALUE IF NOT EXISTS 'EscrowRefund';`);
    await sequelize.query(`ALTER TYPE "enum_Transactions_status" ADD VALUE IF NOT EXISTS 'Completed';`);
  } catch (error) {
    // ENUM types might not exist yet (first run) — sync will create them
  }
}

ensureEnumValues()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => seedDemoData())
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`Jeevika API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed", error.message);
    process.exit(1);
  });

