import express from "express";
import envVars from "./src/utils/env.js"
import routes from "./src/presentation/routes.js"
import db from "./src/database/db.js";

const port = envVars.PORT || 3004;

const app = express();
app.use(express.json());
app.use(routes);
app.listen(port);
console.log(`server is up on port ${port}`);
