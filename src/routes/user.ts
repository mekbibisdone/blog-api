import { Router } from "express";
import {
  createUser,
  deleteUser,
  updateFullname,
  updatePassword,
} from "@src/controller/user";
const userRouter = Router();

userRouter.post("/", createUser);
userRouter.delete("/:userId", deleteUser);
userRouter.put("/:userId/fullname", updateFullname);
userRouter.put("/:userId/password", updatePassword);

export default userRouter;
