import { createBlog } from "@src/controller/blog";
import { Router } from "express";

const blogRouter = Router();

blogRouter.post("/", createBlog);

export default blogRouter;
