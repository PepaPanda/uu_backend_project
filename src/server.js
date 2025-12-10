import express from "express";

//Middleware
import helmet from "helmet";
import cors from "cors";
import apiRouter from "./routes/api.route.js";
import cookieParser from "cookie-parser";
import { nonExistentEndpoint } from "./middleware/nonExistentEndpoint.js";

//Errors
import { AppError } from "./errors/AppError.js";

let { DEV_ENV } = process.env;
DEV_ENV = DEV_ENV === "true";

const app = express();

app.use(helmet());
DEV_ENV &&
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
!DEV_ENV && app.use(cors);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);

app.use(nonExistentEndpoint);

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // express.json() middleware catch
  if (err.type === "entity.parse.failed" && err.status === 400) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  // fallback – non-expected errors
  console.log(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
