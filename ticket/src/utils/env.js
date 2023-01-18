import dotenv from "dotenv";

dotenv.config();

// TODO: add auth server url.
let envVars = {
  DB_URL: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  PORT: process.env.PORT,
};

export default envVars;
