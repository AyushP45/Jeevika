import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: "server/.env" });

const dbName = process.env.DB_NAME || "Jeevika";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "aiml";
const dbHost = process.env.DB_HOST || "localhost";

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "postgres",
  logging: console.log,
});
