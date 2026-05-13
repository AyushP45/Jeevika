import { Job } from "./Job.js";
import { User } from "./User.js";
import { Transaction } from "./Transaction.js";
import { Chat } from "./Chat.js";
import { Notification } from "./Notification.js";
import { Bid } from "./Bid.js";
import { Review } from "./Review.js";

export function setupAssociations() {
  // User <-> Review
  User.hasMany(Review, { foreignKey: "reviewerId", as: "reviewsGiven" });
  User.hasMany(Review, { foreignKey: "revieweeId", as: "reviewsReceived" });
  Review.belongsTo(User, { foreignKey: "reviewerId", as: "reviewer" });
  Review.belongsTo(User, { foreignKey: "revieweeId", as: "reviewee" });

  // Job <-> Review
  Job.hasMany(Review, { foreignKey: "jobId", as: "reviews" });
  Review.belongsTo(Job, { foreignKey: "jobId", as: "job" });

  // User <-> Bid (Worker)
  User.hasMany(Bid, { foreignKey: "workerId", as: "bids" });
  Bid.belongsTo(User, { foreignKey: "workerId", as: "worker" });

  // Job <-> Bid
  Job.hasMany(Bid, { foreignKey: "jobId", as: "jobBids" });
  Bid.belongsTo(Job, { foreignKey: "jobId", as: "job" });

  // User <-> Job
  User.hasMany(Job, { foreignKey: "employerId", as: "postedJobs" });
  Job.belongsTo(User, { foreignKey: "employerId", as: "employer" });
  Job.belongsTo(User, { foreignKey: "workerId", as: "worker" });

  // User <-> Transaction
  User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
  Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });

  // Job <-> Transaction
  Job.hasMany(Transaction, { foreignKey: "jobId", as: "transactions" });
  Transaction.belongsTo(Job, { foreignKey: "jobId", as: "job" });

  // Job <-> Chat
  Job.hasMany(Chat, { foreignKey: "jobId", as: "messages" });
  Chat.belongsTo(Job, { foreignKey: "jobId", as: "job" });

  // User <-> Chat (Sender)
  User.hasMany(Chat, { foreignKey: "senderId", as: "sentMessages" });
  Chat.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  // User <-> Notification
  User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "userId" });
}

export { User, Job, Transaction, Chat, Notification, Bid, Review };
