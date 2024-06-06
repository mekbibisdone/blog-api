import { createBlog, getAllBlogs } from "@src/controller/blog";
import { getSingleBlogByAuthor, getBlogsByAuthor } from "@src/controller/blog";
import { Router } from "express";

const blogRouter = Router();

blogRouter.get("/", getAllBlogs);
blogRouter.post("/", createBlog);

blogRouter.get("/user/:userId", getBlogsByAuthor);
blogRouter.post("/user/:userId", createBlog);

blogRouter.get("/:blogId/user/:userId", getSingleBlogByAuthor);

export default blogRouter;
