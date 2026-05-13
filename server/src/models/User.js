import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../db.js";

export const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("worker", "equipment", "material", "employer", "admin"), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: true, unique: true },
  companyName: { type: DataTypes.STRING, allowNull: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  location: DataTypes.STRING,
  upi: DataTypes.STRING,
  skills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  experience: DataTypes.STRING,
  profilePhoto: { type: DataTypes.TEXT, allowNull: true },
  idProof: { type: DataTypes.TEXT, allowNull: true },
  workSamples: { type: DataTypes.JSON, defaultValue: [] },
  badges: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ["Verified"] },
  rating: { type: DataTypes.FLOAT, defaultValue: 4.5 },
  completedJobs: { type: DataTypes.INTEGER, defaultValue: 0 },
  walletBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  availability: { type: DataTypes.BOOLEAN, defaultValue: true },
  verificationStatus: { type: DataTypes.ENUM("None", "Pending", "Verified", "Rejected"), defaultValue: "None" },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  pushSubscription: { type: DataTypes.JSON, allowNull: true }
}, {
  timestamps: true
});

// Safe user object to return to client (no passwordHash)
User.prototype.toSafeObject = function () {
  const { passwordHash, ...safe } = this.toJSON();
  return safe;
};

User.prototype.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

User.createWithPassword = async function (input) {
  const { password, confirmPassword, ...rest } = input;
  const passwordHash = await bcrypt.hash(password, 10);
  // Only pass defined values to avoid Sequelize errors on undefined
  const cleanData = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== "")
  );
  return this.create({ ...cleanData, passwordHash });
};
