import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Bid = sequelize.define("Bid", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  workerId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  message: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("Pending", "Accepted", "Rejected"), defaultValue: "Pending" }
}, {
  timestamps: true
});
