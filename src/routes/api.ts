import { Router } from "express";
import userRouter from "./user";
import loginRouter from "./login";
import blogRouter from "./blog";
import { getSingleBlogByAuthor, getBlogsByAuthor } from "@src/controller/blog";
// **** Variables **** //

const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/login", loginRouter);
apiRouter.use("/blog", blogRouter);

apiRouter.use("/:id/user/blog", getBlogsByAuthor);
apiRouter.use("/:userId/user/:blogId/blog", getSingleBlogByAuthor);
// **** Export default **** //
export default apiRouter;
