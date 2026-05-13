import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const JobVerification = sequelize.define("JobVerification", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  workerId: { type: DataTypes.UUID, allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },

  // Lifecycle status
  status: {
    type: DataTypes.ENUM(
      "pending_checkin",
      "checked_in",
      "before_proof_submitted",
      "work_in_progress",
      "work_submitted",
      "client_review",
      "approved",
      "rework_requested",
      "disputed",
      "completed"
    ),
    defaultValue: "pending_checkin"
  },

  // Geo Check-In
  checkInTime: { type: DataTypes.DATE, allowNull: true },
  checkOutTime: { type: DataTypes.DATE, allowNull: true },
  checkInLat: { type: DataTypes.FLOAT, allowNull: true },
  checkInLng: { type: DataTypes.FLOAT, allowNull: true },
  checkOutLat: { type: DataTypes.FLOAT, allowNull: true },
  checkOutLng: { type: DataTypes.FLOAT, allowNull: true },
  checkInDeviceId: { type: DataTypes.STRING, allowNull: true },
  checkInNetworkInfo: { type: DataTypes.TEXT, allowNull: true },
  
  // Expected job location
  jobLat: { type: DataTypes.FLOAT, allowNull: true },
  jobLng: { type: DataTypes.FLOAT, allowNull: true },
  allowedRadiusMeters: { type: DataTypes.INTEGER, defaultValue: 500 },

  // GPS validation result
  gpsValidated: { type: DataTypes.BOOLEAN, defaultValue: false },
  distanceFromJobMeters: { type: DataTypes.FLOAT, allowNull: true },

  // Session tracking
  sessionDurationMinutes: { type: DataTypes.FLOAT, allowNull: true },
  expectedMinDurationMinutes: { type: DataTypes.INTEGER, allowNull: true },

  // Selfie / site image at check-in (live camera only)
  checkInSelfie: { type: DataTypes.TEXT, allowNull: true }, // base64 or URL

  // Before work evidence
  beforeImages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  beforeVideo: { type: DataTypes.TEXT, allowNull: true },
  taskNotes: { type: DataTypes.TEXT, allowNull: true },

  // After work evidence
  afterImages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  afterVideo: { type: DataTypes.TEXT, allowNull: true },
  voiceNote: { type: DataTypes.TEXT, allowNull: true },
  completionNote: { type: DataTypes.TEXT, allowNull: true },

  // GPS pings during work (JSON array of {lat, lng, timestamp})
  gpsPings: { type: DataTypes.JSON, defaultValue: [] },

  // AI Fraud Analysis results
  aiTrustScore: { type: DataTypes.FLOAT, allowNull: true },
  aiFraudProbability: { type: DataTypes.FLOAT, allowNull: true },
  aiConfidence: { type: DataTypes.FLOAT, allowNull: true },
  aiFlags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  aiVerdict: { type: DataTypes.STRING, allowNull: true },
  aiAnalyzedAt: { type: DataTypes.DATE, allowNull: true },

  // Client review
  clientAction: {
    type: DataTypes.ENUM("pending", "approved", "rework_requested", "disputed"),
    defaultValue: "pending"
  },
  clientNote: { type: DataTypes.TEXT, allowNull: true },
  clientReviewedAt: { type: DataTypes.DATE, allowNull: true },

  // Submission metadata (watermark / hash)
  submissionHash: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true
});
