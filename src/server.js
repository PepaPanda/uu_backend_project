import express from "express";

//Middleware
import helmet from "helmet";
import cors from "cors";
import apiRouter from "./routes/api.route.js";
import cookieParser from "cookie-parser";

//Errors
import { AppError } from "./errors/AppError.js";
import { NotFoundError } from "./errors/errorList.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);

app.use((req, res, next) => {
  const err = new NotFoundError("This endpoint does not exist");
  return next(err);
});

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
  res.status(500).json({ message: "Internal server error" });
  console.log(err);
});

export default app;
