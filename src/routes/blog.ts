import {
  getBlogsByAuthor,
  createBlog,
  getSingleBlogByAuthor,
} from "@src/controller/blog";
import { createComment } from "@src/controller/comment";
import { Router } from "express";

const blogRouter = Router({ mergeParams: true });

blogRouter.get("/", getBlogsByAuthor);
blogRouter.post("/", createBlog);

blogRouter.get("/:blogId", getSingleBlogByAuthor);

blogRouter.post("/:blogId/comments", createComment);

export default blogRouter;
