import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Chat = sequelize.define("Chat", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  senderId: { type: DataTypes.UUID, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
}, {
  timestamps: true
});
