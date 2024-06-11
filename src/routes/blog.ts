import {
  getBlogsByAuthor,
  createBlog,
  getSingleBlogByAuthor,
  deleteBlog,
  updateBlog,
} from "@src/controller/blog";
import { Router } from "express";
import commentRouter from "./comment";
import { blogValidationChain } from "@src/controller/utils";

const blogRouter = Router({ mergeParams: true });

blogRouter.get("/", getBlogsByAuthor);
blogRouter.post("/", blogValidationChain(), createBlog);

blogRouter.get("/:blogId", getSingleBlogByAuthor);
blogRouter.delete("/:blogId", deleteBlog);
blogRouter.put("/:blogId", blogValidationChain(), updateBlog);

blogRouter.use("/:blogId/comments", commentRouter);

export default blogRouter;
