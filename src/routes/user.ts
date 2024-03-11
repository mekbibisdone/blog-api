import { Router } from "express";
import { createUser } from "@src/controller/user";
const userRouter = Router();

userRouter.post("/", createUser );

export default userRouter;