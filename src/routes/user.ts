import { Router } from "express";
import {
  createUser,
  deleteUser,
  updateFullname,
  updatePassword,
} from "@src/controller/user";
const userRouter = Router();

userRouter.post("/", createUser);
userRouter.delete("/:id", deleteUser);
userRouter.put("/:id/fullname", updateFullname);
userRouter.put("/:id/password", updatePassword);

export default userRouter;
