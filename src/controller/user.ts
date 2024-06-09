import EnvVars from "@src/constants/EnvVars";
import userModel, { IUser } from "@src/models/user";
import { UserBody } from "@src/controller/types";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, param } from "express-validator";
import jwt from "jsonwebtoken";
import { handleUserLookUp, handleBearerToken, handleValidation } from "./utils";

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
  handleValidation,
  function (req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  },
];

export const deleteUser = [
  handleBearerToken,
  param("userId").trim().escape().notEmpty(),
  handleUserLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as IUser;
    const decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
    if (
      typeof decoded === "object" &&
      "id" in decoded &&
      decoded.id === user._id.toString()
    ) {
      await userModel.findByIdAndDelete(user._id.toString());
      res.status(200).json({ msg: `${user.email} was deleted` });
    } else {
      res.status(401).json({
        errors: [{ msg: "Token does not match signed user" }],
      });
    }
    next();
  },
];

export const updateFullname = [
  handleBearerToken,
  body("fullname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Fullname is required"),
  param("userId").trim().escape().notEmpty().withMessage("userId is required"),
  handleValidation,
  handleUserLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    const { fullname } = matchedData(req);
    const user = res.locals.user as IUser;
    const decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
    if (
      typeof decoded === "object" &&
      "id" in decoded &&
      decoded.id === user._id.toString()
    ) {
      await userModel.findByIdAndUpdate(user._id, {
        fullname: fullname as string,
      });
      const updatedUser = await userModel.findById(user._id, { password: 0 });
      res.status(201).json(updatedUser);
    } else {
      res.status(401).json({
        errors: [{ msg: "Token does not match signed user" }],
      });
    }
    next();
  },
];

export const updatePassword = [
  handleBearerToken,
  param("userId").trim().escape().notEmpty().withMessage("Id is required"),
  body("oldPassword").trim().notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isStrongPassword()
    .withMessage("Password not strong enough"),
  handleValidation,
  handleValidation,
  (req: Request, res: Response, next: NextFunction) => {
    res.locals.password = true;
    next();
  },
  handleUserLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    const { oldPassword, newPassword } = matchedData(req);
    const user = res.locals.user as IUser;
    const decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
    if (
      typeof decoded === "object" &&
      "id" in decoded &&
      decoded.id === user._id.toString()
    ) {
      const match = await bcrypt.compare(
        oldPassword as string,
        user.password as string,
      );
      if (match) {
        const newPasswordHash = await bcrypt.hash(newPassword as string, 10);
        await userModel.findByIdAndUpdate(user._id, {
          password: newPasswordHash,
        });
        res.status(201).json({ msg: "Password successfully changed" });
      } else {
        res.status(401).json({
          errors: [{ msg: "Old password does not match" }],
        });
      }
    }
    next();
  },
];
