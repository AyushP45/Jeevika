import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: "SYSTEM" }, // ESCROW, JOB, CHAT, SYSTEM
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  actionUrl: { type: DataTypes.STRING, allowNull: true } // optional link (e.g. /wallet)
}, {
  timestamps: true
});
