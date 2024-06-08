import { createBlog, getAllBlogs } from "@src/controller/blog";
import { getSingleBlogByAuthor, getBlogsByAuthor } from "@src/controller/blog";
import { createComment } from "@src/controller/comment";
import { Router } from "express";

const blogRouter = Router();

blogRouter.get("/", getAllBlogs);
blogRouter.post("/", createBlog);

blogRouter.get("/user/:userId", getBlogsByAuthor);
blogRouter.post("/user/:userId", createBlog);

blogRouter.get("/:blogId/user/:userId", getSingleBlogByAuthor);

blogRouter.post("/:blogId/user/:userId/comments", createComment);
export default blogRouter;
