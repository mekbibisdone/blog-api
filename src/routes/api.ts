import { Router } from "express";
import userRouter from "./user";
import loginRouter from "./login";
import blogRouter from "./blog";
// **** Variables **** //

const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/login", loginRouter);
apiRouter.use("/blog", blogRouter);

// **** Export default **** //
export default apiRouter;
