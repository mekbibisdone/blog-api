import {
  createComment,
  deleteComment,
  getComment,
} from "@src/controller/comment";
import { Router } from "express";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createComment);
commentRouter.get("/:commentId", getComment);

commentRouter.delete("/:commentId", deleteComment);
export default commentRouter;
