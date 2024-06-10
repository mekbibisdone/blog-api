import {
  getBlogsByAuthor,
  createBlog,
  getSingleBlogByAuthor,
} from "@src/controller/blog";
import { Router } from "express";
import commentRouter from "./comment";

const blogRouter = Router({ mergeParams: true });

blogRouter.get("/", getBlogsByAuthor);
blogRouter.post("/", createBlog);

blogRouter.get("/:blogId", getSingleBlogByAuthor);

blogRouter.use("/:blogId/comments", commentRouter);

export default blogRouter;
