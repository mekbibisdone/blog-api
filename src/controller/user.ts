import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";
import { UserBody } from "@src/controller/types";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, validationResult, param } from "express-validator";
import jwt from "jsonwebtoken";
import { handleBearerToken } from "./utils";

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

export const deleteUser = [
  handleBearerToken,
  param("id").trim().escape().notEmpty(),
  function (req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({
        errors: result.array(),
      });
    } else next();
  },
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req);
      const user = await userModel.findById(id);
      if (user === null || typeof user !== "object") {
        res.status(400).json({ errors: [{ msg: "User not found" }] });
      } else {
        const decoded = jwt.verify(
          res.locals.token as string,
          EnvVars.Jwt.Secret,
        );
        if (
          typeof decoded === "object" &&
          "id" in decoded &&
          decoded.id === user.id
        ) {
          await userModel.findByIdAndDelete(user.id);
          res.status(200).json({ msg: `${user.email} was deleted` });
        } else {
          res.status(401).json({
            errors: [{ msg: "Token does not match signed user" }],
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "CastError")
        res.status(400).json({ errors: [{ msg: "Id is invalid" }] });
      else next(err);
    }
  },
];

export const updateFullname = [
  handleBearerToken,
  body("fullname")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Fullname is required"),
  param("id").trim().escape().notEmpty().withMessage("Id is required"),
  function (req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({
        errors: result.array(),
      });
    } else next();
  },
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id, fullname } = matchedData(req);
      const user = await userModel.findById(id, { password: 0 });
      if (user === null || typeof user !== "object") {
        res.status(400).json({ errors: [{ msg: "User not found" }] });
      } else {
        const decoded = jwt.verify(
          res.locals.token as string,
          EnvVars.Jwt.Secret,
        );
        if (
          typeof decoded === "object" &&
          "id" in decoded &&
          decoded.id === user.id
        ) {
          await userModel.findByIdAndUpdate(id, {
            fullname: fullname as string,
          });
          const updatedUser = await userModel.findById(id, { password: 0 });
          res.status(201).json(updatedUser);
        } else {
          res.status(401).json({
            errors: [{ msg: "Token does not match signed user" }],
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "CastError")
        res.status(400).json({ errors: [{ msg: "Id is invalid" }] });
      else next(err);
    }
  },
];

export const updatePassword = [
  handleBearerToken,
  param("id").trim().escape().notEmpty().withMessage("Id is required"),
  body("oldPassword").trim().notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isStrongPassword()
    .withMessage("Password not strong enough"),
  function (req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({
        errors: result.array(),
      });
    } else next();
  },
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id, oldPassword, newPassword } = matchedData(req);
      const user = await userModel.findById(id);
      if (user === null || typeof user !== "object") {
        res.status(400).json({ errors: [{ msg: "User not found" }] });
      } else {
        const decoded = jwt.verify(
          res.locals.token as string,
          EnvVars.Jwt.Secret,
        );
        if (
          typeof decoded === "object" &&
          "id" in decoded &&
          decoded.id === user.id
        ) {
          const match = await bcrypt.compare(
            oldPassword as string,
            user.password as string,
          );
          if (match) {
            const newPasswordHash = await bcrypt.hash(
              newPassword as string,
              10,
            );
            await userModel.findByIdAndUpdate(id, {
              password: newPasswordHash,
            });
            res.status(201).json({ msg: "Password successfully changed" });
          } else {
            res.status(401).json({
              errors: [{ msg: "Old password does not match" }],
            });
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "CastError")
        res.status(400).json({ errors: [{ msg: "Id is invalid" }] });
      else next(err);
    }
  },
];
