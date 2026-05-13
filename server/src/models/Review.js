import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Review = sequelize.define("Review", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  reviewerId: { type: DataTypes.UUID, allowNull: false },
  revieweeId: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: DataTypes.TEXT,
  type: { type: DataTypes.ENUM("EmployerToWorker", "WorkerToEmployer"), allowNull: false }
}, {
  timestamps: true
});
