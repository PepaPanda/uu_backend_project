import { Router } from "express";

//controllers
import { login } from "../../controllers/auth.controller.js";

//middleware
import { validateBody } from "../../middleware/validateBody.js";

//Validation schemas
import { loginUserSchema } from "../../zod_schemas/schemaList.js";

const authRouter = Router();

authRouter.post("/login", validateBody(loginUserSchema), login);

export default authRouter;
