import { Router } from "express";
import { createUser, deleteUser, updateFullname } from "@src/controller/user";
const userRouter = Router();

userRouter.post("/", createUser);
userRouter.delete("/:id", deleteUser);
userRouter.put("/:id/fullname", updateFullname);

export default userRouter;