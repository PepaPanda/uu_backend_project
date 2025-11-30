import { Router } from "express";
import authRouter from "./api/auth.route.js";
import userRouter from "./api/user.route.js";
import shoppingListRouter from "./api/shoppingList.route.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/shoppinglist", shoppingListRouter);

export default apiRouter;
