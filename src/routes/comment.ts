import {
  createComment,
  deleteComment,
  getComment,
  updateComment,
} from "@src/controller/comment";
import { Router } from "express";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", createComment);

commentRouter.get("/:commentId", getComment);
commentRouter.delete("/:commentId", deleteComment);
commentRouter.put("/:commentId", updateComment);

export default commentRouter;
