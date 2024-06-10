import { Router } from "express";
import {
  createUser,
  deleteUser,
  updateFullname,
  updatePassword,
} from "@src/controller/user";
import { getAllBlogs } from "@src/controller/blog";
import blogRouter from "./blog";
const userRouter = Router();

userRouter.get("/", getAllBlogs);
userRouter.post("/", createUser);
userRouter.delete("/:userId", deleteUser);
userRouter.put("/:userId/fullname", updateFullname);
userRouter.put("/:userId/password", updatePassword);

userRouter.use("/:userId/blogs/", blogRouter);

export default userRouter;
