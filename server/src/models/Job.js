import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Job = sequelize.define("Job", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  type: { type: DataTypes.ENUM("Labor", "Equipment", "Material"), allowNull: false },
  category: DataTypes.STRING,
  location: DataTypes.STRING,
  budget: DataTypes.FLOAT,
  paymentType: { type: DataTypes.ENUM("Per Day", "Fixed Total"), defaultValue: "Fixed Total" },
  workersNeeded: { type: DataTypes.INTEGER, defaultValue: 1 },
  duration: DataTypes.STRING,
  images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  sitePhoto: { type: DataTypes.TEXT, allowNull: true },
  coordinates: { type: DataTypes.TEXT, allowNull: true },
  employerId: { type: DataTypes.UUID },
  workerId: { type: DataTypes.UUID, allowNull: true },
  applicants: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
  status: { type: DataTypes.STRING, defaultValue: "Open" },
  startDate: { type: DataTypes.STRING, allowNull: true },
  isDisputed: { type: DataTypes.BOOLEAN, defaultValue: false },
  escrowStatus: { type: DataTypes.ENUM("Optional", "Ready", "Locked", "Released", "Refunded"), defaultValue: "Optional" }
}, {
  timestamps: true
});
