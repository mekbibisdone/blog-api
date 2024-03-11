import { Router } from "express";
import { login } from "@src/controller/login";
const loginRouter = Router();

loginRouter.post("/", login);
export default loginRouter;
