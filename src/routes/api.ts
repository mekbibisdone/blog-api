import { Router } from "express";
import userRouter from "./user";
import loginRouter from "./login";
// **** Variables **** //

const apiRouter = Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/login", loginRouter);

// **** Export default **** //
export default apiRouter;
