import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import envVars from "../utils/env.js";

let { Pool } = pg;
let dbUrl = envVars.DB_URL;
let db = new Pool({
  connectionString: dbUrl,
  ssl: false
});
const sqlPath = "./ticket.sql";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlAbsolutePath = path.resolve(__dirname, sqlPath);
db.query(fs.readFileSync(sqlAbsolutePath, "utf8"));

export default db;
