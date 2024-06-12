import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";
import { LoginBody } from "@src/controller/types";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { body, matchedData } from "express-validator";
import jwt from "jsonwebtoken";
import { handleValidation } from "./utils";

export const login = [
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage(
      "Email is not is not in the correct form. example: dan@gmail.com",
    ),
  body("password").trim().notEmpty().withMessage("Password is required"),
  handleValidation,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = matchedData(req) as LoginBody;
      const userInDb = await userModel.findOne({ email });
      if (userInDb && typeof userInDb === "object") {
        const match = await bcrypt.compare(
          password,
          userInDb.password as string,
        );
        delete userInDb.password;
        if (match) {
          const exp = Number(EnvVars.Jwt.Exp);
          const secret = EnvVars.Jwt.Secret;
          const token = jwt.sign({ data: { ...userInDb }, exp }, secret);
          res.status(200).json({
            fullname: userInDb.fullname,
            email: userInDb.email,
            blogs: userInDb.blogs,
            token,
          });
        } else {
          res.status(401).json({
            errors: [{ msg: "Password does not match" }],
          });
        }
      } else {
        res.status(401).json({
          errors: [{ msg: "Email not found" }],
        });
      }
    } catch (err) {
      next(err);
    } finally {
      next();
    }
  },
];
