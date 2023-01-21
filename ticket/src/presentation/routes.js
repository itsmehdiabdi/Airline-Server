import express from "express";
import {
  handleAsyncErrors,
  errorHandlerMiddleware,
} from "./middlewares/errorhandler.js";
import { authorizationMiddleware } from "./middlewares/authorization.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const routesPath = "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesAbsolutePath = path.resolve(__dirname, routesPath);
const routesFiles = fs.readdirSync(routesAbsolutePath, {
  withFileTypes: false,
});

const endpoints = (
  await Promise.all(routesFiles.map((file) => import(`${routesPath}/${file}`)))
).reduce((prev, file) => [...prev, ...Object.values(file)], []);

endpoints.forEach(({ endpoint, method, handler, private: priv }) => {
  console.log(`${method}\t/${endpoint}`);
  const finalHandler = handleAsyncErrors(handler);
  const finalAuthorizationMiddleware = handleAsyncErrors(authorizationMiddleware)
  const finalHandlerList = priv
    ? [finalAuthorizationMiddleware, finalHandler]
    : [finalHandler];
  router[method.toLowerCase()](`/${endpoint}`, ...finalHandlerList);
});

router.use(errorHandlerMiddleware);

export default router;
