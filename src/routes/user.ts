import { Router } from "express";
import { createUser, deleteUser } from "@src/controller/user";
const userRouter = Router();

userRouter.post("/", createUser);
userRouter.delete("/:id", deleteUser);

export default userRouter;