import userModel from "@src/models/user";
import { body, validationResult, matchedData } from "express-validator";
import { UserBody } from "@src/routes/types/express";
import bcrypt from "bcrypt";
import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import EnvVars from "@src/constants/EnvVars";

export const createUser = [
  body("fullname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Full Name must be at least 2 characters and at most 100 characters",
    ),
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not in the correct form. example: dan@gmail.com")
    .custom(async (value: string) => {
      const user = await userModel.findOne({ email: value });
      if (user)
        throw new Error("A user has already been created with that email");
    }),
  body("password")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword()
    .withMessage("Password isn't strong enough"),
  body("passwordConfirmation")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      const { password } = req.body as UserBody;
      return value === password;
    })
    .withMessage("Password do not match"),
  function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        res.status(400).json({
          errors: result.array(),
          data: req.body as UserBody,
        });
      } else {
        const data = matchedData(req) as UserBody;
        const newUser = new userModel({
          fullname: data.fullname,
          email: data.email,
        });
        bcrypt.hash(data.password, 10, async (err, hash) => {
          if (err) {
            next(err);
          } else {
            newUser.password = hash;
            const user = (await newUser.save()).toJSON();
            delete user.password;
            const exp = Number(EnvVars.Jwt.Exp);
            const secret = EnvVars.Jwt.Secret;
            const token = jwt.sign({ data: { ...user }, exp }, secret);
            res.status(201).json({
              ...user,
              token,
            });
          }
        });
      }
    } catch (error) {
      next(error);
    }
  },
];
