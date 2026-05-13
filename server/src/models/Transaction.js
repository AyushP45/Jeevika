import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Transaction = sequelize.define("Transaction", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  jobId: { type: DataTypes.UUID },
  title: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  type: { type: DataTypes.ENUM("Deposit", "Withdrawal", "EscrowLock", "EscrowRelease", "EscrowRefund"), defaultValue: "EscrowLock" },
  status: { type: DataTypes.ENUM("Locked", "Released", "Refunded", "Pending", "Completed"), defaultValue: "Pending" },
  autoReleaseAt: DataTypes.DATE
}, {
  timestamps: true
});
