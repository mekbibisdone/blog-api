import {
  getBlogsByAuthor,
  createBlog,
  getSingleBlogByAuthor,
  deleteBlog,
  updateBlog,
} from "@src/controller/blog";
import { Router } from "express";
import commentRouter from "./comment";
import { commentValidationChain } from "@src/controller/utils";

const blogRouter = Router({ mergeParams: true });

blogRouter.get("/", getBlogsByAuthor);
blogRouter.post("/", commentValidationChain(), createBlog);

blogRouter.get("/:blogId", getSingleBlogByAuthor);
blogRouter.delete("/:blogId", deleteBlog);
blogRouter.put("/:blogId", commentValidationChain(), updateBlog);

blogRouter.use("/:blogId/comments", commentRouter);

export default blogRouter;
