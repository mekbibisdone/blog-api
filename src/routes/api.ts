import { Router } from "express";
import userRouter from "./user";
// **** Variables **** //

const apiRouter = Router();

apiRouter.use("/user", userRouter);
// **** Export default **** //
export default apiRouter;
