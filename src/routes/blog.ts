import { createBlog, getAllBlogs } from "@src/controller/blog";
import { Router } from "express";

const blogRouter = Router();

blogRouter.get("/", getAllBlogs);
blogRouter.post("/", createBlog);

export default blogRouter;
